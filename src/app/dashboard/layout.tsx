import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { getCachedTenant } from "@/utils/cached-tenant";
import { getCachedOrg } from "@/utils/cached-org-queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organizationId } = await getCachedTenant();
  const org = organizationId ? await getCachedOrg(organizationId) : undefined;

  return (
    <div className="flex min-h-svh w-full flex-col md:flex-row dark:bg-neutral-950 bg-gray-50">
      <DashboardSidebar org={org ?? undefined} />
      <main className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar org={org ?? undefined} />
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
