import { get } from "@vercel/blob";
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

  const document = await get(contractRow.signedDocumentUrl ?? contractRow.fileUrl, {
    access: "private",
    useCache: false,
  });
  if (!document?.stream) return NextResponse.json({ error: "Contract file not found" }, { status: 404 });

  return new NextResponse(document.stream, {
    headers: {
      "Content-Type": document.blob.contentType || "application/pdf",
      "Content-Disposition": `inline; filename="${contractRow.fileName.replace(/[\r\n"]/g, "_")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
