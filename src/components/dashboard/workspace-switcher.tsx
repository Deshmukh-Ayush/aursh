"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2, Plus, ArrowLeftRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WorkspaceSwitcher({ activeWorkspaceId }: { activeWorkspaceId: string }) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    fetch("/api/workspaces")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setWorkspaces(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load workspaces", err);
        setIsLoading(false);
      });
  }, []);

  const handleSelect = (workspaceId: string) => {
    setIsSwitching(true);
    router.push(`/w/${workspaceId}/dashboard`);
    // Reset switching state after a delay to allow navigation
    setTimeout(() => setIsSwitching(false), 1000);
  };

  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);

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
              {activeWorkspace ? (
                <span className="text-[10px] font-bold uppercase">{activeWorkspace.name.charAt(0)}</span>
              ) : (
                <span className="text-[10px] font-bold">W</span>
              )}
            </div>
            <span className="truncate">{activeWorkspace?.name || "Select Workspace"}</span>
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
          {workspaces.map((ws) => (
            <DropdownMenuItem 
              key={ws.id} 
              onSelect={() => handleSelect(ws.id)}
              className="cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
                  <span className="text-[10px] font-bold uppercase">{ws.name.charAt(0)}</span>
                </div>
                <span className="truncate">{ws.name}</span>
              </div>
              {ws.id === activeWorkspaceId && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem 
            onSelect={() => router.push("/workspace?new=true")}
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
