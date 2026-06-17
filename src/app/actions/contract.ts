"use server"

import { put } from '@vercel/blob';
import { db } from "@/utils/db";
import { contract, signature, projectMember, project } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export async function uploadContractAction(projectId: string, formData: FormData) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return { error: "Unauthorized" };

    const file = formData.get('file') as File;
    if (!file) return { error: "No file provided" };
    if (file.type !== 'application/pdf') return { error: "Only PDFs are allowed" };
    if (file.size > 10 * 1024 * 1024) return { error: "File size exceeds 10MB limit" };

    // Check if contract already exists and is signed
    const existing = await db.select().from(contract).where(eq(contract.projectId, projectId));
    if (existing.length > 0 && existing[0].status === 'signed') {
      return { error: "Contract is already signed and locked." };
    }

    // Upload to Vercel Blob
    const blob = await put(`contracts/${projectId}/${file.name}`, file, {
      access: 'public',
    });

    const newContractId = crypto.randomUUID();

    // Get all current project members to seed signatures
    const members = await db.select().from(projectMember).where(eq(projectMember.projectId, projectId));

    // Delete existing contract (and cascaded signatures) if updating
    if (existing.length > 0) {
      await db.delete(contract).where(eq(contract.id, existing[0].id));
    }

    const signatureInserts = members.map(m => ({
      id: crypto.randomUUID(),
      contractId: newContractId,
      userId: m.userId,
    }));

    // Perform database updates
    await db.batch([
      db.insert(contract).values({
        id: newContractId,
        projectId,
        fileUrl: blob.url,
        fileName: file.name,
        status: "draft",
        uploadedBy: session.user.id,
      }),
      ...(signatureInserts.length > 0 ? [db.insert(signature).values(signatureInserts)] : [])
    ]);

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/contract`);
    return { success: true };
  } catch (error) {
    console.error("Upload error:", error);
    return { error: "Failed to upload contract." };
  }
}

export async function requestSignaturesAction(contractId: string) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return { error: "Unauthorized" };

    const [existing] = await db.select().from(contract).where(eq(contract.id, contractId));
    if (!existing) return { error: "Contract not found" };
    if (existing.status !== 'draft') return { error: "Contract is not in draft state" };

    await db.update(contract).set({ status: 'pending_signature' }).where(eq(contract.id, contractId));

    revalidatePath(`/projects/${existing.projectId}`);
    revalidatePath(`/projects/${existing.projectId}/contract`);
    return { success: true };
  } catch (error) {
    console.error("Request signatures error:", error);
    return { error: "Failed to request signatures." };
  }
}

export async function signContractAction(contractId: string) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return { error: "Unauthorized" };

    const userId = session.user.id;

    const [existing] = await db.select().from(contract).where(eq(contract.id, contractId));
    if (!existing) return { error: "Contract not found" };
    if (existing.status !== 'pending_signature') return { error: "Contract is not pending signature" };

    // Update the signature
    await db.update(signature)
      .set({ signedAt: new Date() })
      .where(and(eq(signature.contractId, contractId), eq(signature.userId, userId)));

    // Check if all signatures are done
    const allSigs = await db.select().from(signature).where(eq(signature.contractId, contractId));
    const allSigned = allSigs.every(sig => sig.signedAt !== null);

    if (allSigned) {
      await db.update(contract).set({ status: 'signed' }).where(eq(contract.id, contractId));
    }

    revalidatePath(`/projects/${existing.projectId}`);
    revalidatePath(`/projects/${existing.projectId}/contract`);
    return { success: true };
  } catch (error) {
    console.error("Sign contract error:", error);
    return { error: "Failed to sign contract." };
  }
}
