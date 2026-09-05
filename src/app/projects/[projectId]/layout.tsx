import { ProjectSidebar } from "@/components/sidebar/index";
import { MobileHeader } from "./mobile-header";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="flex min-h-svh w-full flex-col md:flex-row dark:bg-neutral-950 bg-gray-50">
      <ProjectSidebar projectId={projectId} />
      <main className="flex-1 flex flex-col min-w-0">
        <MobileHeader projectId={projectId} />
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
