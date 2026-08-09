import { db } from "@/utils/db";
import { contract, signature, user as userTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";
import { hashDocument } from "@/lib/hash-document";
import { embedSignaturesInPdf, buildAuditTrailEvent } from "@/lib/pdf-signing";
import { z } from "zod";

const signSchema = z.object({
  contractId: z.string().min(1, "Contract ID is required"),
  signatureData: z.string().optional().nullable(),
  signatureMethod: z.string().optional().nullable(),
  orgPlan: z.enum(["free", "freelancer", "agency"]).optional().default("free"),
});

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const validationResult = signSchema.safeParse(payload);
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.issues[0].message }, { status: 400 });
    }

    const { contractId, signatureData, signatureMethod, orgPlan } = validationResult.data;

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const [existing] = await db.select().from(contract).where(eq(contract.id, contractId));
    if (!existing) return NextResponse.json({ error: "Contract not found" }, { status: 404 });

    if (existing.status !== "pending_signature" && existing.status !== "draft") {
      return NextResponse.json({ error: "Contract is not pending signature" }, { status: 400 });
    }

    // If still in draft, auto-promote to pending_signature on first sign
    if (existing.status === "draft") {
      await db.update(contract).set({ status: "pending_signature" }).where(eq(contract.id, contractId));
    }

    const isPaidPlan = orgPlan === "freelancer" || orgPlan === "agency";
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    let currentDocHash = existing.documentHash;
    let originalBuffer: ArrayBuffer | null = null;

    if (isPaidPlan && existing.fileUrl) {
      const pdfRes = await fetch(existing.fileUrl);
      if (pdfRes.ok) {
        originalBuffer = await pdfRes.arrayBuffer();
        currentDocHash = hashDocument(originalBuffer);
      }
    }

    await db.update(signature)
      .set({
        signedAt: new Date(),
        signatureData: signatureData || null,
        signatureMethod: signatureMethod || "draw",
        ipAddress,
        userAgent,
        documentHash: currentDocHash,
        auditTrail: [buildAuditTrailEvent("signed", userId, { ipAddress, signatureMethod: signatureMethod || "draw" })],
      })
      .where(and(eq(signature.contractId, contractId), eq(signature.userId, userId)));

    const allSigs = await db.select().from(signature).where(eq(signature.contractId, contractId));
    const allSigned = allSigs.length > 0 && allSigs.every((sig) => sig.signedAt !== null);

    if (allSigned) {
      const finalStatusUpdate: { status: "signed"; signedDocumentUrl?: string } = { status: "signed" };
      await db.update(contract).set(finalStatusUpdate).where(eq(contract.id, contractId));
    }

    await logActivity({
      projectId: existing.projectId,
      userId: session.user.id,
      type: "contract_signed",
      metadata: { fullySigned: allSigned },
    });

    revalidatePath(`/projects/${existing.projectId}`);
    revalidatePath(`/projects/${existing.projectId}/contract`);
    return NextResponse.json({ success: true, fullySigned: allSigned });
  } catch (error) {
    console.error("Contract sign error:", error);
    return NextResponse.json({ error: "Failed to process contract signature." }, { status: 500 });
  }
}
