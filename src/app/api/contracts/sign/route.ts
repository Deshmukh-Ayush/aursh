import { put } from "@vercel/blob";
import { db } from "@/utils/db";
import { contract, signature, user as userTable } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
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

    const isPaidPlan = orgPlan === "freelancer" || orgPlan === "agency";
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    let currentDocHash = existing.documentHash;
    let originalBuffer: ArrayBuffer | null = null;

    if (existing.fileUrl) {
      try {
        const pdfRes = await fetch(existing.fileUrl);
        if (pdfRes.ok) {
          originalBuffer = await pdfRes.arrayBuffer();
          currentDocHash = hashDocument(originalBuffer);
        }
      } catch (e) {
        console.error("Failed to fetch contract PDF buffer:", e);
      }
    }

    // Ensure user has a signature record for this contract
    const [existingSig] = await db
      .select()
      .from(signature)
      .where(and(eq(signature.contractId, contractId), eq(signature.userId, userId)));

    if (!existingSig) {
      await db.insert(signature).values({
        id: crypto.randomUUID(),
        contractId,
        userId,
        signedAt: new Date(),
        signatureData: signatureData || null,
        signatureMethod: signatureMethod || "draw",
        ipAddress,
        userAgent,
        documentHash: currentDocHash,
        auditTrail: [buildAuditTrailEvent("signed", userId, { ipAddress, signatureMethod: signatureMethod || "draw" })],
      });
    } else {
      await db
        .update(signature)
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
    }

    const allSigs = await db.select().from(signature).where(eq(signature.contractId, contractId));
    const signedSigs = allSigs.filter((sig) => sig.signedAt !== null);

    // Contract is signed if any party signed
    const isSigned = signedSigs.length > 0;

    if (isSigned) {
      const finalStatusUpdate: { status: "signed"; signedDocumentUrl?: string } = { status: "signed" };

      if (originalBuffer) {
        try {
          const userIds = signedSigs.map((s) => s.userId).filter((id): id is string => Boolean(id));
          const users = userIds.length > 0 ? await db.select().from(userTable).where(inArray(userTable.id, userIds)) : [];

          const sigItems = signedSigs.map((sig) => {
            const u = users.find((u) => u.id === sig.userId);
            return {
              name: u?.name || "Verified Signer",
              email: u?.email || "verified@scrunity.io",
              ip: sig.ipAddress || "127.0.0.1",
              timestamp: sig.signedAt?.toISOString() || new Date().toISOString(),
              signatureData: sig.signatureData || "",
              method: sig.signatureMethod || "draw",
            };
          });

          const signedPdfBuffer = await embedSignaturesInPdf(originalBuffer, sigItems);
          const finalBlob = await put(`contracts/${existing.projectId}/signed_${existing.fileName}`, signedPdfBuffer, {
            access: "public",
            addRandomSuffix: false,
            allowOverwrite: true,
          });
          finalStatusUpdate.signedDocumentUrl = finalBlob.url;
        } catch (e) {
          console.error("PDF signature seal embedding notice:", e);
        }
      }

      await db.update(contract).set(finalStatusUpdate).where(eq(contract.id, contractId));
    }

    await logActivity({
      projectId: existing.projectId,
      userId: session.user.id,
      type: "contract_signed",
      metadata: { fullySigned: isSigned },
    });

    revalidatePath(`/projects/${existing.projectId}`);
    revalidatePath(`/projects/${existing.projectId}/contract`);
    return NextResponse.json({ success: true, fullySigned: isSigned });
  } catch (error) {
    console.error("Contract sign error:", error);
    return NextResponse.json({ error: "Failed to process contract signature." }, { status: 500 });
  }
}
