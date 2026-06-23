"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Project Error Caught:", error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-60px)] w-full flex-col items-center justify-center p-8 text-center bg-background">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight mb-2">Something went wrong</h2>
      <p className="text-muted-foreground max-w-[400px] mb-6">
        An error occurred while loading this section of the workspace.
      </p>
      <Button onClick={() => reset()} variant="default">
        Try again
      </Button>
    </div>
  );
}
