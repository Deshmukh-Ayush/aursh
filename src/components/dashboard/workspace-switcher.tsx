"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building2, Check, ChevronsUpDown, Loader2, Plus, ArrowLeftRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WorkspaceSwitcher({ activeOrgId }: { activeOrgId: string }) {
  const router = useRouter();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    authClient.organization.list().then(({ data }) => {
      if (data) setOrgs(data);
      setIsLoading(false);
    });
  }, []);

  const handleSelect = async (orgId: string | null) => {
    setIsSwitching(true);
    // If null is passed, it clears the active organization
    await authClient.organization.setActive({ organizationId: orgId as string });
    router.refresh();
    // Reset switching state after a delay to allow refresh to happen
    setTimeout(() => setIsSwitching(false), 1000);
  };

  const activeOrg = orgs.find((org) => org.id === activeOrgId);

  if (isLoading) {
    return (
      <Button variant="outline" className="w-[200px] justify-between" disabled>
        <div className="flex items-center gap-2 overflow-hidden">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="truncate">Loading...</span>
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-[200px] justify-between shadow-sm"
          disabled={isSwitching}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
              {activeOrg?.logoUrl ? (
                <img src={activeOrg.logoUrl} alt={activeOrg.name} className="h-5 w-5 object-contain rounded" />
              ) : (
                <Building2 className="h-3 w-3" />
              )}
            </div>
            <span className="truncate">{activeOrg?.name || "Select Workspace"}</span>
          </div>
          {isSwitching ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[240px]" align="end">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Workspaces
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {orgs.map((org) => (
            <DropdownMenuItem 
              key={org.id} 
              onSelect={() => handleSelect(org.id)}
              className="cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
                  {org.logoUrl ? (
                    <img src={org.logoUrl} alt={org.name} className="h-5 w-5 object-contain rounded" />
                  ) : (
                    <span className="text-[10px] font-bold uppercase">{org.name.charAt(0)}</span>
                  )}
                </div>
                <span className="truncate">{org.name}</span>
              </div>
              {org.id === activeOrgId && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem 
            onSelect={() => handleSelect(null)}
            className="cursor-pointer"
          >
            <ArrowLeftRight className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>View all workspaces</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onSelect={() => router.push("/onboarding")}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Create workspace</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
