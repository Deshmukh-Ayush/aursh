import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contracts & Agreements",
  description: "Review, upload, and e-sign statements of work, NDAs, and project agreements.",
};

import { db } from "@/utils/db";
import { contract, signature, user } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ContractVaultClient, ContractWithSignatures } from "@/components/projects/contracts/contract-vault-client";
import { getProjectAccess } from "@/lib/project-auth";

const documentTypes = ["sow", "nda", "noc", "msa", "addendum", "other"] as const;
const contractStatuses = ["draft", "pending_signature", "signed"] as const;

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

export default async function ContractPage({ params }: { params: Promise<{ projectId: string }> }) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return redirect("/sign-in");

  const resolvedParams = await params;
  const projectId = resolvedParams.projectId;
  const userId = session.user.id;

  const { proj, role, isAuthorized } = await getProjectAccess(projectId, userId);
  if (!isAuthorized || !proj || !role) return redirect("/dashboard");

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

  // Group signatures by contract. Contract lifecycle transitions happen only
  // in the signing endpoint, never as a side effect of rendering this page.
  const signaturesByContract = new Map<string, typeof allSignatures>();
  for (const s of allSignatures) {
    const list = signaturesByContract.get(s.sig.contractId) || [];
    list.push(s);
    signaturesByContract.set(s.sig.contractId, list);
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
      userRole={role}
    />
  );
}
