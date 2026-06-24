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
      className="w-full sm:w-auto gap-2 bg-emerald-500 hover:bg-emerald-600 mt-4 sm:mt-0"
    >
      <Flag className="w-4 h-4" />
      {isUpdating ? "Completing..." : "Mark Project Complete"}
    </Button>
  );
}
