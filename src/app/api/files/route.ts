import { db } from "@/utils/db";
import { files } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { logActivity } from "@/lib/activity";
import { uploadRateLimiter, checkRateLimit } from "@/lib/ratelimit";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess } from "@/lib/project-auth";

const allowedMimeTypes = new Set([
  "application/pdf", "application/zip", "application/x-zip-compressed",
  "image/jpeg", "image/png", "image/webp", "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export async function POST(req: NextRequest) {
  try {
    const reqHeaders = await headers();
    
    const formData = await req.formData();
    const file = formData.get("file");
    const projectId = formData.get("projectId");

    if (!(file instanceof File) || typeof projectId !== "string" || projectId.length === 0) {
      return NextResponse.json({ error: "File and Project ID are required." }, { status: 400 });
    }

    const fileSchema = z.object({
      size: z.number().max(25 * 1024 * 1024, "File size must be less than 25MB"),
    });

    const validationResult = fileSchema.safeParse({
      size: file.size,
    });

    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.issues[0].message }, { status: 400 });
    }
    if (!allowedMimeTypes.has(file.type)) return NextResponse.json({ error: "This file type is not allowed." }, { status: 400 });

    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const access = await getProjectAccess(projectId, userId);
    if (!access.proj) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (!access.isAuthorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (access.proj.status === "completed") return NextResponse.json({ error: "Cannot upload files to a completed project." }, { status: 400 });
    const rateLimitResult = await checkRateLimit(uploadRateLimiter, `upload_${userId}`);
    if (!rateLimitResult.success) return NextResponse.json({ error: "Too many uploads. Please try again later." }, { status: 429 });

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_") || "upload";
    const blob = await put(`files/${projectId}/${crypto.randomUUID()}/${safeFileName}`, file, {
      access: "private",
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
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upload file error:", error);
    return NextResponse.json({ error: "Failed to upload file." }, { status: 500 });
  }
}
