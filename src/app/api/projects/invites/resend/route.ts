import { db } from "@/utils/db";
import { project, projectInvitation, organization } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendProjectInvitationEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { projectId, email } = await req.json();

    if (!projectId || !email) {
      return NextResponse.json({ error: "Project ID and email are required." }, { status: 400 });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [proj] = await db.select().from(project).where(eq(project.id, projectId));
    if (!proj) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const [invitation] = await db
      .select()
      .from(projectInvitation)
      .where(
        and(
          eq(projectInvitation.projectId, projectId),
          eq(projectInvitation.email, email.trim().toLowerCase())
        )
      );
    if (!invitation) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    if (invitation.status === "accepted") return NextResponse.json({ error: "Invitation already accepted" }, { status: 400 });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${invitation.token}`;

    const [org] = await db.select().from(organization).where(eq(organization.id, proj.organizationId));

    await sendProjectInvitationEmail(
      invitation.email, 
      proj.name, 
      inviteLink,
      org?.plan as "free" | "freelancer" | "agency" | undefined,
      org?.logoUrl,
      org?.brandColor
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend invite error:", error);
    return NextResponse.json({ error: "Failed to resend invite." }, { status: 500 });
  }
}
