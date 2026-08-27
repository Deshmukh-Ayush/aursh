import { getBlobStream } from "@/lib/blob";
import { contract } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getProjectAccess } from "@/lib/project-auth";
import { db } from "@/utils/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const contractId = new URL(req.url).searchParams.get("contractId");
  if (!contractId) return NextResponse.json({ error: "Contract ID is required" }, { status: 400 });

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [contractRow] = await db.select().from(contract).where(eq(contract.id, contractId));
  if (!contractRow) return NextResponse.json({ error: "Contract not found" }, { status: 404 });

  const access = await getProjectAccess(contractRow.projectId, session.user.id);
  if (!access.isAuthorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const targetUrl = contractRow.signedDocumentUrl || contractRow.fileUrl;
  let blobData = await getBlobStream(targetUrl);

  // Fallback to original fileUrl if signedDocumentUrl failed
  if (!blobData && contractRow.signedDocumentUrl && contractRow.fileUrl !== contractRow.signedDocumentUrl) {
    blobData = await getBlobStream(contractRow.fileUrl);
  }

  if (!blobData?.stream) {
    return NextResponse.json({ error: "Contract document stream unavailable" }, { status: 404 });
  }

  return new NextResponse(blobData.stream, {
    headers: {
      "Content-Type": blobData.contentType || "application/pdf",
      "Content-Disposition": `inline; filename="${contractRow.fileName.replace(/[\r\n"]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "frame-ancestors 'self'",
    },
  });
}
