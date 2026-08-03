import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/utils/db";
import { eq, and } from "drizzle-orm";
import { organization, member, user } from "@/db/schema";
import { getTenantContext } from "@/lib/tenant-context";
import { OrgSettingsForm } from "@/components/dashboard/org-settings-form";
import { BillingPlans } from "@/components/dashboard/billing-plans";
import { OrgMembersManager } from "@/components/dashboard/org-members-manager";

export default async function SettingsPage() {
  const reqHeaders = await headers();
  const ctx = await getTenantContext(reqHeaders);

  if (ctx.error || !ctx.user) {
    redirect("/sign-in");
  }

  const activeOrgId = ctx.organizationId;

  if (!activeOrgId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-2xl mx-auto mt-12 border rounded-xl bg-muted/20">
        <h2 className="text-xl font-semibold">No Active Organization</h2>
        <p className="text-muted-foreground mt-2">
          You need an active organization to view settings.
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
    .where(and(eq(member.organizationId, activeOrgId), eq(member.userId, ctx.user.id)));

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

  const orgMembers = await db
    .select({
      id: member.id,
      role: member.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      }
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, activeOrgId));

  return (
    <div className="flex flex-col min-h-svh p-4 md:p-8 gap-8 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your white-label branding and agency settings.
        </p>
      </div>
      <div className="grid gap-12">
        <BillingPlans orgId={org.id} currentPlan={org.plan} />
        
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold tracking-tight">Team Management</h2>
          <p className="text-sm text-muted-foreground">
            Invite your agency teammates to collaborate on projects.
          </p>
        </div>
        <OrgMembersManager org={{ id: org.id, plan: org.plan }} initialMembers={orgMembers} />

        <div className="flex flex-col gap-2 mt-4">
          <h2 className="text-xl font-semibold tracking-tight">White-Label Branding</h2>
          <p className="text-sm text-muted-foreground">
            Configure your custom logo and brand colors (Agency plan only).
          </p>
        </div>
        <OrgSettingsForm org={org} />
      </div>
    </div>
  );
}
