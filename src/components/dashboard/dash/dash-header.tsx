import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { SignOutButton } from "@/components/sign-out-button";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";

interface DashboardHeaderProps {
  activeWorkspaceId?: string | null;
}

export function DashboardHeader({ activeWorkspaceId }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage your workspaces and client collaboration.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <SignOutButton />

        {activeWorkspaceId ? (
          <>
            <WorkspaceSwitcher activeWorkspaceId={activeWorkspaceId} />
            <Link href={`/w/${activeWorkspaceId}/dashboard/settings`}>
              <Button variant="outline">Settings</Button>
            </Link>
            <CreateProjectDialog workspaceId={activeWorkspaceId} />
          </>
        ) : null}
      </div>
    </div>
  );
}