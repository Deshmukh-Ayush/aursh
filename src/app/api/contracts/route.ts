import { put } from '@vercel/blob';
import { db } from "@/utils/db";
import { contract, signature, projectMember, project } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const projectId = formData.get("projectId") as string;
    const file = formData.get('file') as File;

    if (!projectId || !file) {
      return NextResponse.json({ error: "Project ID and file are required" }, { status: 400 });
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

    const existing = await db.select().from(contract).where(eq(contract.projectId, projectId));
    if (existing.length > 0 && existing[0].status === 'signed') {
      return NextResponse.json({ error: "Contract is already signed and locked." }, { status: 400 });
    }

    const blob = await put(`contracts/${projectId}/${file.name}`, file, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    const newContractId = crypto.randomUUID();
    const members = await db.select().from(projectMember).where(eq(projectMember.projectId, projectId));

    if (existing.length > 0) {
      await db.delete(contract).where(eq(contract.id, existing[0].id));
    }

    const signatureInserts = members.map(m => ({
      id: crypto.randomUUID(),
      contractId: newContractId,
      userId: m.userId,
    }));

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

    await logActivity({
      projectId,
      userId: session.user.id,
      type: "contract_uploaded",
      metadata: { fileName: file.name }
    });

    const otherMembers = members.filter(m => m.userId !== session.user.id);
    for (const m of otherMembers) {
      await createNotification(m.userId, projectId, "contract_uploaded", `A new contract "${file.name}" has been uploaded.`);
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/contract`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload contract." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { contractId, action } = await req.json();

    if (!contractId || !action) {
      return NextResponse.json({ error: "Contract ID and action are required" }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const [existing] = await db.select().from(contract).where(eq(contract.id, contractId));
    if (!existing) return NextResponse.json({ error: "Contract not found" }, { status: 404 });

    if (action === "request_signatures") {
      if (existing.status !== 'draft') return NextResponse.json({ error: "Contract is not in draft state" }, { status: 400 });

      await db.update(contract).set({ status: 'pending_signature' }).where(eq(contract.id, contractId));
      
      // We don't log signature request right now as per original code logic

      revalidatePath(`/projects/${existing.projectId}`);
      revalidatePath(`/projects/${existing.projectId}/contract`);
      return NextResponse.json({ success: true });
    } 
    
    if (action === "sign") {
      if (existing.status !== 'pending_signature') return NextResponse.json({ error: "Contract is not pending signature" }, { status: 400 });

      await db.update(signature)
        .set({ signedAt: new Date() })
        .where(and(eq(signature.contractId, contractId), eq(signature.userId, userId)));

      const allSigs = await db.select().from(signature).where(eq(signature.contractId, contractId));
      const allSigned = allSigs.every(sig => sig.signedAt !== null);

      if (allSigned) {
        await db.update(contract).set({ status: 'signed' }).where(eq(contract.id, contractId));
      }

      await logActivity({
        projectId: existing.projectId,
        userId: session.user.id,
        type: "contract_signed",
        metadata: { fullySigned: allSigned }
      });

      const otherMembers = allSigs.filter(sig => sig.userId !== session.user.id);
      for (const m of otherMembers) {
        await createNotification(
          m.userId, 
          existing.projectId, 
          "contract_signed", 
          allSigned ? "The contract has been fully signed!" : `${session.user.name || "A user"} signed the contract.`
        );
      }

      revalidatePath(`/projects/${existing.projectId}`);
      revalidatePath(`/projects/${existing.projectId}/contract`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

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

    let role: "agency" | "client" | "owner" | null = null;
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, existing.projectId), eq(projectMember.userId, session.user.id)));

    const [proj] = await db.select().from(project).where(eq(project.id, existing.projectId));

    if (member) {
      role = member.role as "agency" | "client" | "owner";
    } else if (proj && session.session?.activeOrganizationId === proj.organizationId) {
      role = "agency";
    }

    if (!role || (role !== 'owner' && role !== 'agency')) {
      return NextResponse.json({ error: "Only the project owner or agency can delete the contract" }, { status: 403 });
    }

    if (existing.status === 'signed') {
      return NextResponse.json({ error: "Cannot delete a signed contract" }, { status: 400 });
    }

    await db.delete(signature).where(eq(signature.contractId, contractId));
    await db.delete(contract).where(eq(contract.id, contractId));

    revalidatePath(`/projects/${existing.projectId}`);
    revalidatePath(`/projects/${existing.projectId}/contract`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete contract error:", error);
    return NextResponse.json({ error: "Failed to delete contract." }, { status: 500 });
  }
}
