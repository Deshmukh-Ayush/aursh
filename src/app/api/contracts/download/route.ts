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

  const targetUrl = contractRow.signedDocumentUrl || contractRow.fileUrl;
  let stream: ReadableStream | null = null;
  let contentType = "application/pdf";

  // Tier 1: Try Vercel Blob private get on targetUrl
  try {
    const document = await get(targetUrl, { access: "private", useCache: false });
    if (document?.stream) {
      stream = document.stream;
      if (document.blob?.contentType) contentType = document.blob.contentType;
    }
  } catch (err) {
    console.warn("Vercel Blob get for targetUrl notice:", err);
  }

  // Tier 2: Try Vercel Blob private get on original fileUrl if targetUrl was signedDocumentUrl
  if (!stream && contractRow.signedDocumentUrl && contractRow.fileUrl !== contractRow.signedDocumentUrl) {
    try {
      const document = await get(contractRow.fileUrl, { access: "private", useCache: false });
      if (document?.stream) {
        stream = document.stream;
        if (document.blob?.contentType) contentType = document.blob.contentType;
      }
    } catch (err) {
      console.warn("Fallback Vercel Blob get for original fileUrl notice:", err);
    }
  }

  // Tier 3: Direct HTTP fetch fallback on targetUrl
  if (!stream) {
    try {
      const res = await fetch(targetUrl);
      if (res.ok && res.body) {
        stream = res.body;
        contentType = res.headers.get("content-type") || "application/pdf";
      }
    } catch (err) {
      console.warn("HTTP fetch fallback for targetUrl notice:", err);
    }
  }

  // Tier 4: Direct HTTP fetch fallback on fileUrl
  if (!stream && contractRow.fileUrl) {
    try {
      const res = await fetch(contractRow.fileUrl);
      if (res.ok && res.body) {
        stream = res.body;
        contentType = res.headers.get("content-type") || "application/pdf";
      }
    } catch (err) {
      console.error("HTTP fetch fallback for fileUrl error:", err);
    }
  }

  if (!stream) {
    return NextResponse.json({ error: "Contract document stream unavailable" }, { status: 404 });
  }

  return new NextResponse(stream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${contractRow.fileName.replace(/[\r\n"]/g, "_")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
