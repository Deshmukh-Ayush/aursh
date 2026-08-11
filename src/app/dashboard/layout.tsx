import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/utils/db";
import { organization, member, projectMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { getTenantContext } from "@/lib/tenant-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const ctx = await getTenantContext(reqHeaders);

  if (ctx.error || !ctx.user) {
    redirect("/sign-in");
  }

  const userId = ctx.user.id;

  // Concurrently query org memberships & client project memberships (Promise.all)
  const [orgMemberships, clientProjectMemberships] = await Promise.all([
    db
      .select({ orgId: member.organizationId, role: member.role })
      .from(member)
      .where(eq(member.userId, userId)),
    db
      .select({ projectId: projectMember.projectId })
      .from(projectMember)
      .where(and(eq(projectMember.userId, userId), eq(projectMember.role, "client"))),
  ]);

  const isAgencyUser = orgMemberships.some(
    (m) => m.role === "owner" || m.role === "member" || m.role === "admin" || m.role === "agency"
  );

  // STRICT CLIENT SAFEGUARD:
  // If the user is NOT an agency owner/member (i.e. strictly a Client):
  // They are NOT allowed to view /dashboard or the internal agency sidebar!
  if (!isAgencyUser) {
    if (clientProjectMemberships.length > 0) {
      redirect(`/projects/${clientProjectMemberships[0].projectId}`);
    } else {
      // Redirect unassigned clients to sign-in or project invite landing
      redirect("/sign-in");
    }
  }

  let org = undefined;
  if (ctx.organizationId) {
    const [fetchedOrg] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, ctx.organizationId));
    if (fetchedOrg) {
      org = {
        ...fetchedOrg,
        logoUrl: fetchedOrg.logoUrl ?? undefined,
      };
    }
  }

  // Pass client project options for Dual-Role Users to topbar
  const hasClientProjects = clientProjectMemberships.length > 0;
  const firstClientProjectId = clientProjectMemberships[0]?.projectId;

  return (
    <div className="flex min-h-svh w-full flex-col md:flex-row dark:bg-neutral-950 bg-gray-50">
      <DashboardSidebar org={org} />
      <main className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar
          org={org}
          hasClientProjects={hasClientProjects}
          firstClientProjectId={firstClientProjectId}
        />
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
