import { del } from '@vercel/blob';
import { putBlob } from "@/lib/blob";
import { db } from "@/utils/db";
import { contract, signature, projectMember } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server"; // Next 15+. If you're on 14.x, this is `unstable_after` from "next/server" instead.
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";
import { hashDocument } from "@/lib/hash-document";
import { z } from "zod";
import { canManageProject, getProjectAccess } from "@/lib/project-auth";

const documentTypeSchema = z.enum(["sow", "nda", "noc", "msa", "addendum", "other"]);

const uploadContractSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  documentType: documentTypeSchema.catch("sow"),
});

const requestSignaturesSchema = z.object({
  contractId: z.string().min(1, "Contract ID is required"),
  action: z.literal("request_signatures"),
});

function toStorageFileName(fileName: string): string {
  const normalized = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return normalized || "contract.pdf";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const uploadInput = uploadContractSchema.safeParse({
      projectId: formData.get("projectId"),
      documentType: formData.get("documentType") ?? "sow",
    });
    if (!uploadInput.success) {
      return NextResponse.json({ error: uploadInput.error.issues[0].message }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A contract PDF is required" }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: "Only PDFs are allowed" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { projectId, documentType } = uploadInput.data;

    // Authorization check and member lookup both only depend on projectId —
    // no reason to make one wait on the other.
    const [{ role, isAuthorized }, members] = await Promise.all([
      getProjectAccess(projectId, userId),
      db
        .select({ userId: projectMember.userId })
        .from(projectMember)
        .where(eq(projectMember.projectId, projectId)),
    ]);

    if (!isAuthorized || !canManageProject(role)) {
      return NextResponse.json({ error: "Only the project owner or agency can upload contracts" }, { status: 403 });
    }

    const signerIds = new Set(members.map((member) => member.userId));
    signerIds.add(userId);

    const newContractId = crypto.randomUUID();
    const storageFileName = toStorageFileName(file.name);

    // The blob upload (network I/O) and reading the file into a buffer for
    // hashing (CPU-bound, cheap) are independent — File supports multiple
    // independent reads, so overlap them instead of running sequentially.
    const [blob, fileBuffer] = await Promise.all([
      putBlob(`contracts/${projectId}/${newContractId}/${storageFileName}`, file, {
        addRandomSuffix: false,
        allowOverwrite: true,
      }),
      file.arrayBuffer(),
    ]);
    const docHash = hashDocument(fileBuffer);

    const signatureInserts: Array<typeof signature.$inferInsert> = Array.from(signerIds, (signerId) => ({
      id: crypto.randomUUID(),
      contractId: newContractId,
      userId: signerId,
    }));

    try {
      await db.batch([
        db.insert(contract).values({
          id: newContractId,
          projectId,
          fileUrl: blob.url,
          fileName: file.name,
          documentType,
          uploadedByRole: "agency",
          documentHash: docHash,
          status: "draft",
          uploadedBy: userId,
        }),
        db.insert(signature).values(signatureInserts),
      ]);
    } catch (error) {
      await del(blob.url).catch(() => undefined);
      throw error;
    }

    // Activity logging + cache revalidation don't need to block the response —
    // the client already has everything it needs once the DB write succeeds.
    after(async () => {
      await logActivity({
        projectId,
        userId,
        type: "contract_uploaded",
        metadata: { fileName: file.name, documentType, uploadedByRole: "agency" },
      });
      revalidatePath("/dashboard");
      revalidatePath(`/projects/${projectId}`);
      revalidatePath(`/projects/${projectId}/contract`);
    });

    return NextResponse.json({
      success: true,
      contractId: newContractId,
      contract: {
        id: newContractId,
        projectId,
        fileName: file.name,
        documentType,
        status: "draft",
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload contract." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const validationResult = requestSignaturesSchema.safeParse(await req.json());
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.issues[0].message }, { status: 400 });
    }

    const { contractId } = validationResult.data;

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const [existing] = await db.select().from(contract).where(eq(contract.id, contractId));
    if (!existing) return NextResponse.json({ error: "Contract not found" }, { status: 404 });

    const { role, isAuthorized } = await getProjectAccess(existing.projectId, userId);
    if (!isAuthorized || !canManageProject(role)) {
      return NextResponse.json({ error: "Only the project owner or agency can request signatures" }, { status: 403 });
    }

    if (existing.status !== "draft") {
      return NextResponse.json({ error: "Contract has already been sent for signature" }, { status: 400 });
    }

    await db.update(contract).set({ status: "pending_signature" }).where(eq(contract.id, contractId));

    after(() => {
      revalidatePath("/dashboard");
      revalidatePath(`/projects/${existing.projectId}`);
      revalidatePath(`/projects/${existing.projectId}/contract`);
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Contract PATCH error:", error);
    return NextResponse.json({ error: "Failed to process contract action." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contractId = searchParams.get("contractId");

    if (!contractId) {
      return NextResponse.json({ error: "Contract ID is required" }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [existing] = await db.select().from(contract).where(eq(contract.id, contractId));
    if (!existing) return NextResponse.json({ error: "Contract not found" }, { status: 404 });

    const { role, isAuthorized } = await getProjectAccess(existing.projectId, session.user.id);
    if (!isAuthorized || !canManageProject(role)) {
      return NextResponse.json({ error: "Only the project owner or agency can delete the contract" }, { status: 403 });
    }

    const immutableStatuses = ["signed", "partially_signed", "fully_signed"];
    if (immutableStatuses.includes(existing.status)) {
      return NextResponse.json({ error: "Contracts with signatures are immutable and cannot be deleted" }, { status: 400 });
    }

    await db.delete(contract).where(eq(contract.id, contractId));

    // Blob cleanup and cache revalidation don't need to block the response.
    after(async () => {
      await del(existing.fileUrl).catch((error: unknown) => {
        console.error("Failed to remove contract blob:", error);
      });
      revalidatePath("/dashboard");
      revalidatePath(`/projects/${existing.projectId}`);
      revalidatePath(`/projects/${existing.projectId}/contract`);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete contract error:", error);
    return NextResponse.json({ error: "Failed to delete contract." }, { status: 500 });
  }
}