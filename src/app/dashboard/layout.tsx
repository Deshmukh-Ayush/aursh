import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/utils/db";
import { organization } from "@/db/schema";
import { eq } from "drizzle-orm";
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

  return (
    <div className="flex min-h-svh w-full flex-col md:flex-row dark:bg-neutral-950 bg-gray-50">
      <DashboardSidebar org={org} />
      <main className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar org={org} />
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
