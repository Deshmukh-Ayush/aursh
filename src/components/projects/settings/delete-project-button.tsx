"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    setIsDeleting(true);
    try {
      const res = await axios.delete(`/api/projects?projectId=${projectId}`);
      if (res.data.success) {
        toast.success("Project deleted successfully");
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete project");
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isDeleting} className="mt-4">
          {isDeleting ? "Deleting..." : "Delete Project"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your project,
            all uploaded files, contracts, and activity history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault(); // Prevent modal from closing immediately so we can show loading state
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Yes, Delete Project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
