import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { SignOutButton } from "@/components/sign-out-button";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";

interface DashboardHeaderProps {
  activeOrgId?: string | null;
}

export function DashboardHeader({ activeOrgId }: DashboardHeaderProps) {
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

        {activeOrgId ? (
          <>
            <WorkspaceSwitcher activeOrgId={activeOrgId} />
            <Link href="/dashboard/settings">
              <Button variant="outline">Settings</Button>
            </Link>
            <CreateProjectDialog />
          </>
        ) : null}
      </div>
    </div>
  );
}