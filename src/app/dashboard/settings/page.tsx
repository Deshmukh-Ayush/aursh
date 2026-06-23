import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/utils/db";
import { organization, member } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { OrgSettingsForm } from "@/components/dashboard/org-settings-form";

export default async function SettingsPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const activeOrgId = session.session?.activeOrganizationId;

  if (!activeOrgId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-2xl mx-auto mt-12 border rounded-xl bg-muted/20">
        <h2 className="text-xl font-semibold">No Active Organization</h2>
        <p className="text-muted-foreground mt-2">
          You need to select an active organization from the dashboard to view settings.
        </p>
      </div>
    );
  }

  const [org] = await db.select().from(organization).where(eq(organization.id, activeOrgId));
  if (!org) {
    return <div>Organization not found</div>;
  }

  const [orgMember] = await db
    .select()
    .from(member)
    .where(and(eq(member.organizationId, activeOrgId), eq(member.userId, session.user.id)));

  if (!orgMember || orgMember.role !== "owner") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-2xl mx-auto mt-12 border rounded-xl bg-muted/20">
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground mt-2">
          Only organization owners can access these settings.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-svh p-4 md:p-8 gap-8 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your white-label branding and agency settings.
        </p>
      </div>

      <OrgSettingsForm org={org} />
    </div>
  );
}
