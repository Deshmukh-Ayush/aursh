"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { markProjectCompleteAction } from "@/app/actions/project-settings";
import { toast } from "sonner";
import { Flag } from "lucide-react";

export function MarkCompleteButton({ projectId }: { projectId: string }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleComplete = async () => {
    setIsUpdating(true);
    const result = await markProjectCompleteAction(projectId);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Project marked as completed!");
    }
    
    setIsUpdating(false);
  };

  return (
    <Button 
      onClick={handleComplete} 
      disabled={isUpdating}
      size="sm"
      className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_1px_3px_rgba(16,185,129,0.3)] active:scale-[0.96] transition-transform text-[13px]"
    >
      <Flag className="w-3.5 h-3.5" />
      {isUpdating ? "Completing…" : "Complete Project"}
    </Button>
  );
}
