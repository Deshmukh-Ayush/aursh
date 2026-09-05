import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh w-full flex-col md:flex-row dark:bg-neutral-950 bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar />
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
