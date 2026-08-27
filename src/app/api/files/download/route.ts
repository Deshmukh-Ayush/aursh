import { getBlobStream } from "@/lib/blob";
import { files } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getProjectAccess } from "@/lib/project-auth";
import { db } from "@/utils/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const fileId = new URL(req.url).searchParams.get("fileId");
  if (!fileId) return NextResponse.json({ error: "File ID is required" }, { status: 400 });
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [file] = await db.select().from(files).where(eq(files.id, fileId));
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });
  const access = await getProjectAccess(file.projectId, session.user.id);
  if (!access.isAuthorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  const blobData = await getBlobStream(file.url);
  if (!blobData?.stream) return NextResponse.json({ error: "File not found" }, { status: 404 });
  
  return new NextResponse(blobData.stream, {
    headers: {
      "Content-Type": blobData.contentType || file.mimeType,
      "Content-Disposition": `attachment; filename="${file.name.replace(/[\r\n"]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "frame-ancestors 'self'",
    },
  });
}
