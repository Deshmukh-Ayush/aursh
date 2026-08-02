import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { SignOutButton } from "@/components/sign-out-button";

interface DashboardHeaderProps {
  hasOrganization?: boolean;
}

export function DashboardHeader({ hasOrganization = true }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage your projects and client collaboration.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <SignOutButton />

        {hasOrganization && (
          <>
            <Link href="/dashboard/settings">
              <Button variant="outline">Settings</Button>
            </Link>
            <CreateProjectDialog />
          </>
        )}
      </div>
    </div>
  );
}