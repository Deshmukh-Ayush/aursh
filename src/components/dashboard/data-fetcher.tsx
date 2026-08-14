import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { fetchSidebarData, fetchTopbarData } from "@/lib/dashboard-data";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";

export async function DashboardSidebarWrapper() {
  const org = await fetchSidebarData();
  return <DashboardSidebar org={org} />;
}

export async function DashboardTopbarWrapper() {
  const [org, topbarData] = await Promise.all([
    fetchSidebarData(),
    fetchTopbarData(),
  ]);

  return (
    <DashboardTopbar
      org={org}
      hasClientProjects={topbarData?.hasClientProjects}
      firstClientProjectId={topbarData?.firstClientProjectId}
    />
  );
}