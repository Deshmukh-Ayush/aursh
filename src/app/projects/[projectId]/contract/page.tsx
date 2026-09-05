import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/utils/db";
import { contract, signature, user } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { ContractVaultClient, ContractWithSignatures } from "@/components/projects/contracts/contract-vault-client";
import { getProjectAccess } from "@/lib/project-auth";
import { getCachedSession } from "@/utils/cached-session";
import crypto from "crypto";

export const metadata: Metadata = {
  title: "Contracts & Agreements",
  description: "Review, upload, and e-sign statements of work, NDAs, and project agreements.",
};

const documentTypes = ["sow", "nda", "noc", "msa", "addendum", "other"] as const;
const contractStatuses = ["draft", "sent", "pending_signature", "partially_signed", "fully_signed", "signed"] as const;

function isDocumentType(
  value: string,
): value is ContractWithSignatures["contract"]["documentType"] {
  return documentTypes.includes(value as (typeof documentTypes)[number]);
}

function isContractStatus(
  value: string,
): value is ContractWithSignatures["contract"]["status"] {
  return contractStatuses.includes(value as (typeof contractStatuses)[number]);
}

async function ContractData({ projectId }: { projectId: string }) {
  const [session, access] = await Promise.all([
    getCachedSession(),
    getProjectAccess(projectId),
  ]);
  const userId = session.user.id;
  const role = access.role || "agency";

  // Fetch all contracts for this project
  const allContracts = await db
    .select({
      contract: contract,
      uploader: user,
    })
    .from(contract)
    .leftJoin(user, eq(contract.uploadedBy, user.id))
    .where(eq(contract.projectId, projectId))
    .orderBy(desc(contract.createdAt));

  const contractIds = allContracts.map((c) => c.contract.id);

  // Fetch all signatures and linked users
  let allSignatures: Array<{
    sig: typeof signature.$inferSelect;
    usr: typeof user.$inferSelect | null;
  }> = [];

  if (contractIds.length > 0) {
    allSignatures = await db
      .select({
        sig: signature,
        usr: user,
      })
      .from(signature)
      .leftJoin(user, eq(signature.userId, user.id))
      .where(inArray(signature.contractId, contractIds));
  }

  // Group signatures by contract.
  const signaturesByContract = new Map<string, typeof allSignatures>();
  for (const s of allSignatures) {
    const list = signaturesByContract.get(s.sig.contractId) || [];
    list.push(s);
    signaturesByContract.set(s.sig.contractId, list);
  }

  // Ensure active user has a signature recipient record for every contract in the project
  const contractsNeedingSig = allContracts.filter(
    (c) => !(signaturesByContract.get(c.contract.id) || []).some((s) => s.sig.userId === userId)
  );

  if (contractsNeedingSig.length > 0) {
    const newSigRows = contractsNeedingSig.map((c) => ({
      id: crypto.randomUUID(),
      contractId: c.contract.id,
      userId: userId,
    }));
    await db.insert(signature).values(newSigRows).catch(() => undefined);

    // Re-query signatures so the page receives full signature recipient data
    allSignatures = await db
      .select({
        sig: signature,
        usr: user,
      })
      .from(signature)
      .leftJoin(user, eq(signature.userId, user.id))
      .where(inArray(signature.contractId, contractIds));

    signaturesByContract.clear();
    for (const s of allSignatures) {
      const list = signaturesByContract.get(s.sig.contractId) || [];
      list.push(s);
      signaturesByContract.set(s.sig.contractId, list);
    }
  }

  // `server-serialization`: structure contracts payload for ContractVaultClient
  const serializedContracts: ContractWithSignatures[] = allContracts.map((c) => {
    const sigs = signaturesByContract.get(c.contract.id) || [];
    return {
      contract: {
        id: c.contract.id,
        projectId: c.contract.projectId,
        fileName: c.contract.fileName,
        fileUrl: `/api/contracts/download?contractId=${encodeURIComponent(c.contract.id)}`,
        documentType: isDocumentType(c.contract.documentType)
          ? c.contract.documentType
          : "sow",
        uploadedByRole: c.contract.uploadedByRole === "client" ? "client" : "agency",
        status: isContractStatus(c.contract.status) ? c.contract.status : "draft",
        signedDocumentUrl: c.contract.signedDocumentUrl
          ? `/api/contracts/download?contractId=${encodeURIComponent(c.contract.id)}`
          : null,
        documentHash: c.contract.documentHash,
        createdAt: c.contract.createdAt,
      },
      uploaderName: c.uploader?.name || "Unknown",
      signatures: sigs.map((s) => ({
        sigId: s.sig.id,
        userId: s.sig.userId,
        userName: s.usr?.name || "Unknown",
        userEmail: s.usr?.email || "Unknown",
        userImage: s.usr?.image || null,
        signedAt: s.sig.signedAt,
      })),
    };
  });

  return (
    <ContractVaultClient
      projectId={projectId}
      contracts={serializedContracts}
      currentUserId={userId}
      userRole={role as any}
    />
  );
}

export default async function ContractPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
      <ContractData projectId={projectId} />
    </Suspense>
  );
}
