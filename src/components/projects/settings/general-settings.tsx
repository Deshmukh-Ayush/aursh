"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { renameProjectAction, updateProjectStatusAction } from "@/app/actions/project-settings";
import { CheckCircle2, Circle } from "lucide-react";

export function GeneralSettings({ 
  projectId, 
  initialName, 
  initialStatus, 
  role 
}: { 
  projectId: string; 
  initialName: string; 
  initialStatus: string;
  role: string;
}) {
  const [name, setName] = useState(initialName);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const canEdit = role === "owner" || role === "agency";

  const handleRename = async () => {
    if (name.trim() === initialName) return;
    if (!name.trim()) {
      toast.error("Project name cannot be empty");
      setName(initialName);
      return;
    }

    setIsRenaming(true);
    const result = await renameProjectAction(projectId, name);
    if (result.error) {
      toast.error(result.error);
      setName(initialName);
    } else {
      toast.success("Project renamed successfully");
    }
    setIsRenaming(false);
  };

  const handleStatusToggle = async (newStatus: "active" | "completed") => {
    if (initialStatus === newStatus) return;
    
    setIsUpdatingStatus(true);
    const result = await updateProjectStatusAction(projectId, newStatus);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Project marked as ${newStatus}`);
    }
    setIsUpdatingStatus(false);
  };

  return (
    <div className="grid gap-6">
      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
          <CardTitle className="text-base font-semibold">Project Details</CardTitle>
          <CardDescription>
            Update the project&apos;s name and basic identity.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-end gap-4 max-w-md">
            <div className="space-y-2 w-full">
              <label className="text-[13px] font-medium text-foreground">Project Name</label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit || isRenaming}
                className="h-9 text-[13px] rounded-lg shadow-sm"
              />
            </div>
            {canEdit && (
              <Button 
                onClick={handleRename}
                disabled={isRenaming || name.trim() === initialName}
                className="h-9 px-4 rounded-lg bg-foreground text-background hover:bg-foreground/90 active:scale-[0.98] transition-all"
              >
                {isRenaming ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
          <CardTitle className="text-base font-semibold">Project Status</CardTitle>
          <CardDescription>
            Mark the project as completed to freeze new activity, or keep it active.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleStatusToggle("active")}
              disabled={!canEdit || isUpdatingStatus}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-medium transition-all ${
                initialStatus === "active" 
                  ? "bg-primary/10 text-primary ring-1 ring-primary/20" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              <Circle className={`w-4 h-4 ${initialStatus === "active" ? "fill-primary/20" : ""}`} />
              Active
            </button>

            <button
              onClick={() => handleStatusToggle("completed")}
              disabled={!canEdit || isUpdatingStatus}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-medium transition-all ${
                initialStatus === "completed" 
                  ? "bg-green-500/10 text-green-600 ring-1 ring-green-500/20 dark:bg-green-500/15 dark:text-green-400" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${initialStatus === "completed" ? "fill-green-500/20" : ""}`} />
              Completed
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
