"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Building2, Plus, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function OrgSelector() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    router.push(`/w/${workspaceId}/dashboard`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p className="text-sm font-medium">Loading your workspaces...</p>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto text-left">
        <Card className="border-primary/20 shadow-lg bg-card">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to Scrunity</CardTitle>
            <CardDescription className="text-base mt-2">
              To get started, create your first workspace. This is where you'll manage clients, projects, and deliverables.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8 pt-4">
            <Button size="lg" onClick={() => router.push("/workspace")} className="h-12 px-8 text-base shadow-md group">
              Create Workspace
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-2">
      <div className="grid gap-4 md:grid-cols-2">
        {workspaces.map((ws) => (
          <Card 
            key={ws.id} 
            className="group cursor-pointer hover:border-primary/50 transition-colors shadow-sm hover:shadow-md"
            onClick={() => handleSelect(ws.id)}
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <span className="text-lg font-bold uppercase">{ws.name.charAt(0)}</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-lg">{ws.name}</span>
                  <span className="text-sm text-muted-foreground">Workspace</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="group-hover:bg-primary/10 group-hover:text-primary">
                <ArrowRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        ))}

        <Card 
          className="group cursor-pointer border-dashed hover:border-primary/50 transition-colors bg-muted/30 hover:bg-muted/50"
          onClick={() => router.push("/workspace")}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center h-full text-muted-foreground group-hover:text-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background border mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
              <Plus className="h-6 w-6" />
            </div>
            <span className="font-medium">Create New Workspace</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
