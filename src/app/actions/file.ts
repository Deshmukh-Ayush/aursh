"use server"

import { db } from "@/utils/db";
import { files, project, projectMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { logActivity } from "@/lib/activity";

export async function uploadFileAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;

    const [proj] = await db.select().from(project).where(eq(project.id, projectId));
    if (proj?.status === 'completed') {
      return { error: "Cannot upload files to a completed project." };
    }

    if (!file || !projectId) {
      return { error: "File and Project ID are required." };
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Verify membership
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));

    if (!member) {
      return { error: "Unauthorized. You are not a member of this project." };
    }

    // Upload to Vercel Blob
    const blob = await put(`files/${projectId}/${file.name}`, file, {
      access: "public",
    });

    // Insert into DB
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
    return { success: true, url: blob.url };
  } catch (error) {
    console.error("Upload file error:", error);
    return { error: "Failed to upload file." };
  }
}
