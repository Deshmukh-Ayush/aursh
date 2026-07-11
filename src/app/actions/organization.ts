"use server";

import { db } from "@/utils/db";
import { organization, member } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

export async function updateOrgBrandingAction(orgId: string, formData: FormData) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Verify the user is an owner of this org
    const [orgMember] = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, orgId), eq(member.userId, userId)));

    if (!orgMember || orgMember.role !== "owner") {
      return { error: "Only organization owners can update branding." };
    }

    const [org] = await db.select().from(organization).where(eq(organization.id, orgId));
    if (!org) {
      return { error: "Organization not found." };
    }

    // We do NOT block on plan level here per requirements (UI only gate for now)

    const file = formData.get("logo") as File | null;
    const brandColor = formData.get("brandColor") as string | null;

    let logoUrl = org.logoUrl;

    if (file && file.size > 0) {
      try {
        const blob = await put(`logos/${orgId}-${Date.now()}-${file.name}`, file, {
          access: 'public',
        });
        logoUrl = blob.url;
      } catch (uploadError) {
        console.error("Blob upload error:", uploadError);
        return { error: "Failed to upload logo to Vercel Blob. Ensure BLOB_READ_WRITE_TOKEN is set." };
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
    // Also revalidate project routes since sidebar uses org branding
    revalidatePath("/projects/[projectId]", "layout");

    return { success: true };
  } catch (error) {
    console.error("Update org branding error:", error);
    return { error: "Failed to update branding settings." };
  }
}

export async function toggleOrgPlanAction(orgId: string, plan: "free" | "freelancer" | "agency") {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const [orgMember] = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, orgId), eq(member.userId, session.user.id)));

    if (!orgMember || orgMember.role !== "owner") {
      return { error: "Only organization owners can change the plan." };
    }

    await db.update(organization)
      .set({ plan, updatedAt: new Date() })
      .where(eq(organization.id, orgId));

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidatePath("/projects/[projectId]", "layout");

    return { success: true };
  } catch (error) {
    console.error("Toggle org plan error:", error);
    return { error: "Failed to toggle plan." };
  }
}
