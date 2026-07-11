import { db } from "@/utils/db";
import { files, project, projectMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;

    if (!file || !projectId) {
      return NextResponse.json({ error: "File and Project ID are required." }, { status: 400 });
    }

    const [proj] = await db.select().from(project).where(eq(project.id, projectId));
    if (proj?.status === 'completed') {
      return NextResponse.json({ error: "Cannot upload files to a completed project." }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));

    if (!member) {
      return NextResponse.json({ error: "Unauthorized. You are not a member of this project." }, { status: 403 });
    }

    const blob = await put(`files/${projectId}/${file.name}`, file, {
      access: "public",
    });

    await db.insert(files).values({
      id: crypto.randomUUID(),
      projectId,
      uploadedBy: userId,
      name: file.name,
      url: blob.url,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
    });

    await logActivity({
      projectId,
      userId,
      type: "file_uploaded",
      metadata: { fileName: file.name, size: file.size }
    });

    revalidatePath(`/projects/${projectId}/files`);
    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Upload file error:", error);
    return NextResponse.json({ error: "Failed to upload file." }, { status: 500 });
  }
}
