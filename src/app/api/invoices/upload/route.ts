import { putBlob } from "@/lib/blob";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

export async function POST(req: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const assetType = (formData.get("assetType") as string) || "asset";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image size must be less than 5MB" }, { status: 400 });
    }

    if (!allowedImageTypes.has(file.type)) {
      return NextResponse.json({ error: "File must be a PNG, JPEG, WEBP, or SVG image" }, { status: 400 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_") || "asset";
    const storagePath = `invoices/assets/${session.user.id}/${assetType}_${Date.now()}_${safeName}`;

    const blob = await putBlob(storagePath, file, {
      addRandomSuffix: true,
      allowOverwrite: true,
      contentType: file.type,
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Invoice asset upload error:", error);
    return NextResponse.json({ error: "Failed to upload asset" }, { status: 500 });
  }
}
