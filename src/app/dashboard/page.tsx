"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient, useSession } from "@/lib/auth-client";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { data: activeOrg, isPending: orgPending } =
    authClient.useActiveOrganization();

  const clickHandler = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  if (isPending || orgPending) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-svh p-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-medium">Dashboard</h1>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Name: </span>
            {session?.user.name}
          </p>
          <p>
            <span className="text-muted-foreground">Organization: </span>
            {activeOrg?.name ?? "—"}
          </p>
        </div>
        <Button onClick={clickHandler}>Sign Out</Button>
      </div>
    </div>
  );
}
