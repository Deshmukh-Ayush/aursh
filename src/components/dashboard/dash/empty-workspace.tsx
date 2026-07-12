import { LayoutDashboard } from "lucide-react";

import { OrgSelector } from "@/components/org-selector";

interface EmptyWorkspaceProps {
  hasOrganization: boolean;
  hasProjects: boolean;
}

export function EmptyWorkspace({
  hasOrganization,
  hasProjects,
}: EmptyWorkspaceProps) {
  if (!hasOrganization) {
    return (
      <div className="rounded-xl border bg-muted/20 p-8 text-center md:p-12">
        <p className="mb-4 text-muted-foreground">
          You need an active organization to manage and create your own agency
          projects.
        </p>

        <OrgSelector />
      </div>
    );
  }

  if (hasProjects) return null;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/10 p-12 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        <LayoutDashboard className="h-8 w-8 text-primary" />
      </div>

      <h3 className="text-lg font-semibold">
        No agency projects yet
      </h3>

      <p className="mt-2 max-w-sm text-muted-foreground">
        Create your first project to start collaborating with your clients.
      </p>
    </div>
  );
}