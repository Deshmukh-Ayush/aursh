"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function WorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Auto-redirect to first workspace if exists and ?new=true is not set
  useEffect(() => {
    const isNew = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get("new") : null;
    if (isNew === "true") {
      setIsChecking(false);
      return;
    }

    fetch("/api/workspaces")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          router.push(`/w/${data[0].id}/dashboard`);
        } else {
          setIsChecking(false);
        }
      })
      .catch(() => {
        setIsChecking(false);
      });
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <p className="text-sm text-muted-foreground animate-pulse">Checking workspaces...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const trimmedName = name.trim();
    const slug = slugify(trimmedName);

    if (!slug) {
      setError("Please enter a valid workspace name.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create workspace.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/w/${data.id}/dashboard`);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-medium">Create a workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Workspaces are where your team manages projects.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="workspace-name" className="text-sm font-medium">
              Workspace Name
            </label>
            <input
              id="workspace-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Design Team"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Workspace"}
          </Button>
        </form>
      </div>
    </div>
  );
}
