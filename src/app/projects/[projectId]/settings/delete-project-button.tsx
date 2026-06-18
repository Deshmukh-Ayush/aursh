"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteProjectAction } from "@/app/actions/project-settings";
import { useRouter } from "next/navigation";

export function DeleteProjectButton({ projectId, role }: { projectId: string, role: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  if (role !== "owner") {
    return (
      <div className="text-sm text-muted-foreground mt-4">
        Only the project owner can delete this project.
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm("Are you absolute sure you want to delete this project? This action cannot be undone and will permanently delete all files, contracts, and history.")) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteProjectAction(projectId);
    
    if (result.error) {
      alert(result.error);
      setIsDeleting(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <Button 
      variant="destructive" 
      onClick={handleDelete} 
      disabled={isDeleting}
      className="mt-4"
    >
      {isDeleting ? "Deleting..." : "Delete Project"}
    </Button>
  );
}
