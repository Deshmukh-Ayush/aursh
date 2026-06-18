"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function OrgSelector() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authClient.organization.list().then(({ data }) => {
      if (data) setOrgs(data);
      setIsLoading(false);
    });
  }, []);

  const handleSelect = async (orgId: string) => {
    setIsLoading(true);
    await authClient.organization.setActive({ organizationId: orgId });
    router.refresh();
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading organizations...</div>;

  if (orgs.length === 0) {
    return (
      <Button onClick={() => router.push("/onboarding")}>
        Create an Organization
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-4 items-center mt-4">
      <div className="flex flex-wrap gap-2 justify-center">
        {orgs.map((org) => (
          <Button key={org.id} variant="default" onClick={() => handleSelect(org.id)}>
            Select "{org.name}"
          </Button>
        ))}
      </div>
      <Button variant="link" className="text-muted-foreground" onClick={() => router.push("/onboarding")}>
        Or create a new organization
      </Button>
    </div>
  );
}
