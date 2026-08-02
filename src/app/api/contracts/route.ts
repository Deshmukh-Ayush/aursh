import { put } from '@vercel/blob';
import { db } from "@/utils/db";
import { contract, signature, projectMember, project } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";
import { hashDocument } from "@/lib/hash-document";
import { embedSignaturesInPdf, buildAuditTrailEvent } from "@/lib/pdf-signing";
import { z } from "zod";

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

    const fileBuffer = await file.arrayBuffer();
    const docHash = hashDocument(fileBuffer);

    const newContractId = crypto.randomUUID();
    const members = await db.select().from(projectMember).where(eq(projectMember.projectId, projectId));

    const signatureInserts = members.map(m => ({
      id: crypto.randomUUID(),
      contractId: newContractId,
      userId: m.userId,
    }));

    await db.transaction(async (tx) => {
      if (existing.length > 0) {
        await tx.delete(contract).where(eq(contract.id, existing[0].id));
      }

      await tx.insert(contract).values({
        id: newContractId,
        projectId,
        fileUrl: blob.url,
        fileName: file.name,
        documentHash: docHash,
        status: "draft",
        uploadedBy: session.user.id,
      });

      if (signatureInserts.length > 0) {
        await tx.insert(signature).values(signatureInserts);
      }
    });

    await logActivity({
      projectId,
      userId: session.user.id,
      type: "contract_uploaded",
      metadata: { fileName: file.name }
    });


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
    const payload = await req.json();

    const patchSchema = z.object({
      contractId: z.string().min(1, "Contract ID is required"),
      action: z.enum(["request_signatures", "sign"]),
      signatureData: z.string().optional().nullable(),
      signatureMethod: z.string().optional().nullable(),
      orgPlan: z.enum(["free", "freelancer", "agency"]).optional().default("free"),
    });

    const validationResult = patchSchema.safeParse(payload);
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.issues[0].message }, { status: 400 });
    }

    const { contractId, action, signatureData, signatureMethod, orgPlan } = validationResult.data;

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

      const isPaidPlan = orgPlan === "freelancer" || orgPlan === "agency";
      
      const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
      const userAgent = req.headers.get("user-agent") || "unknown";

      let currentDocHash = null;
      let originalBuffer = null;

      if (isPaidPlan) {
        // Fetch and verify PDF
        const pdfRes = await fetch(existing.fileUrl);
        if (!pdfRes.ok) {
          throw new Error(`Failed to fetch contract PDF: ${pdfRes.status} ${pdfRes.statusText}`);
        }
        originalBuffer = await pdfRes.arrayBuffer();
        currentDocHash = hashDocument(originalBuffer);

        if (currentDocHash !== existing.documentHash) {
           return NextResponse.json({ error: "Document has been tampered with since upload." }, { status: 400 });
        }
      }

      await db.update(signature)
        .set({ 
          signedAt: new Date(),
          ...(isPaidPlan && {
             signatureData,
             signatureMethod: signatureMethod as string | null,
             ipAddress,
             userAgent,
             documentHash: currentDocHash,
             auditTrail: [buildAuditTrailEvent("signed", userId, { ipAddress, signatureMethod: signatureMethod as string })]
          })
        })
        .where(and(eq(signature.contractId, contractId), eq(signature.userId, userId)));

      const allSigs = await db.select().from(signature).where(eq(signature.contractId, contractId));
      const allSigned = allSigs.every(sig => sig.signedAt !== null);

      if (allSigned) {
        let finalStatusUpdate: any = { status: 'signed' };

        if (isPaidPlan && originalBuffer) {
           // Embed signatures
           try {
             // Get users to attach names/emails
             const sigMembers = await db.query.signature.findMany({
               where: eq(signature.contractId, contractId),
               with: { user: true } // Assuming we have relation but we don't, need to fetch users
             });
             
             // Since we didn't add the `with: { user: true }` relation in schema for signature, we fetch manually
             // But actually we did: signatureRelations has `user`. 
           } catch(e) {} // ignore for now to write raw query

           const userIds = allSigs.map(s => s.userId).filter((id): id is string => Boolean(id));
           const users = userIds.length > 0 ? await db.query.user.findMany({
              where: (u, { inArray }) => inArray(u.id, userIds)
           }) : [];

           const sigItems = allSigs.map(sig => {
              const u = users.find(u => u.id === sig.userId);
              return {
                 name: u?.name || "Unknown",
                 email: u?.email || "Unknown",
                 ip: sig.ipAddress || "Unknown",
                 timestamp: sig.signedAt?.toISOString() || new Date().toISOString(),
                 signatureData: sig.signatureData || "",
                 method: sig.signatureMethod || "unknown",
              };
           });

           const signedPdfBuffer = await embedSignaturesInPdf(originalBuffer, sigItems);
           const finalBlob = await put(`contracts/${existing.projectId}/signed_${existing.fileName}`, signedPdfBuffer, {
              access: 'public',
              addRandomSuffix: false,
              allowOverwrite: true,
           });
           finalStatusUpdate.signedDocumentUrl = finalBlob.url;
        }

        await db.update(contract).set(finalStatusUpdate).where(eq(contract.id, contractId));
      }

      await logActivity({
        projectId: existing.projectId,
        userId: session.user.id,
        type: "contract_signed",
        metadata: { fullySigned: allSigned }
      });


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

    // if (existing.status === 'signed') {
    //   return NextResponse.json({ error: "Cannot delete a signed contract" }, { status: 400 });
    // }

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
