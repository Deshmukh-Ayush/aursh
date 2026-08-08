import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contracts & Agreements",
  description: "Review, upload, and e-sign statements of work, NDAs, and project agreements.",
};

import { db } from "@/utils/db";
import { contract, signature, projectMember, user, project, organization } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ContractVaultClient, ContractWithSignatures } from "@/components/projects/contracts/contract-vault-client";
import { getProjectAccess } from "@/lib/project-auth";

export default async function ContractPage({ params }: { params: Promise<{ projectId: string }> }) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return redirect("/sign-in");

  const resolvedParams = await params;
  const projectId = resolvedParams.projectId;
  const userId = session.user.id;

  const { proj, role, isAuthorized } = await getProjectAccess(projectId, userId);
  if (!isAuthorized || !proj || !role) return redirect("/dashboard");

  // Fetch org plan
  const [org] = await db.select().from(organization).where(eq(organization.id, proj.organizationId));
  const orgPlan = org?.plan || "free";

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

  // `js-combine-iterations`: group signatures by contractId
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
        fileUrl: c.contract.fileUrl,
        documentType: (c.contract.documentType || "sow") as any,
        uploadedByRole: (c.contract.uploadedByRole || "agency") as any,
        status: c.contract.status as any,
        signedDocumentUrl: c.contract.signedDocumentUrl,
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
      orgPlan={orgPlan}
    />
  );
}
