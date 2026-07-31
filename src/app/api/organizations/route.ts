import { db } from "@/utils/db";
import { organization, member } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const reqHeaders = await headers();
    
    const ip = reqHeaders.get("x-forwarded-for") || "unknown-ip";
    const rateLimitResult = rateLimit(`org_${ip}`, 10, 60 * 1000); // 10 per min
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const contentType = req.headers.get("content-type") || "";

    // Handle branding update (multipart/form-data)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const orgId = formData.get("orgId") as string;
      const file = formData.get("logo") as File | null;
      const brandColor = formData.get("brandColor") as string | null;

      if (!orgId) return NextResponse.json({ error: "Organization ID required" }, { status: 400 });

      const [orgMember] = await db
        .select()
        .from(member)
        .where(and(eq(member.organizationId, orgId), eq(member.userId, userId)));

      if (!orgMember || orgMember.role !== "owner") {
        return NextResponse.json({ error: "Only organization owners can update branding." }, { status: 403 });
      }

      const [org] = await db.select().from(organization).where(eq(organization.id, orgId));
      if (!org) return NextResponse.json({ error: "Organization not found." }, { status: 404 });

      let logoUrl = org.logoUrl;

      if (file && file.size > 0) {
        try {
          const blob = await put(`logos/${orgId}-${Date.now()}-${file.name}`, file, {
            access: 'public',
          });
          logoUrl = blob.url;
        } catch (uploadError) {
          console.error("Blob upload error:", uploadError);
          return NextResponse.json({ error: "Failed to upload logo." }, { status: 500 });
        }
      }

      await db.update(organization)
        .set({
          logoUrl: logoUrl,
          brandColor: brandColor || org.brandColor,
          updatedAt: new Date(),
        })
        .where(eq(organization.id, orgId));

      revalidatePath("/dashboard/settings");
      revalidatePath("/dashboard");
      revalidatePath("/projects/[projectId]", "layout");

      return NextResponse.json({ success: true });
    } 
    // Handle plan toggle (application/json)
    else {
      const payload = await req.json();

      const patchSchema = z.object({
        orgId: z.string().min(1, "Organization ID is required"),
        plan: z.enum(["free", "freelancer", "agency"]),
      });

      const validationResult = patchSchema.safeParse(payload);
      if (!validationResult.success) {
        return NextResponse.json({ error: validationResult.error.issues[0].message }, { status: 400 });
      }

      const { orgId, plan } = validationResult.data;

      const [orgMember] = await db
        .select()
        .from(member)
        .where(and(eq(member.organizationId, orgId), eq(member.userId, userId)));

      if (!orgMember || orgMember.role !== "owner") {
        return NextResponse.json({ error: "Only organization owners can change the plan." }, { status: 403 });
      }

      await db.update(organization)
        .set({ plan, updatedAt: new Date() })
        .where(eq(organization.id, orgId));

      revalidatePath("/dashboard/settings");
      revalidatePath("/dashboard");
      revalidatePath("/projects/[projectId]", "layout");

      return NextResponse.json({ success: true });
    }

  } catch (error) {
    console.error("Update organization error:", error);
    return NextResponse.json({ error: "Failed to update organization." }, { status: 500 });
  }
}
