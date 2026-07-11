"use client";

import { useState } from "react";
import { MoreHorizontal, Edit, Trash2, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ProjectRowMenu({
  projectId,
  projectName,
  draftContractId,
}: {
  projectId: string;
  projectName: string;
  draftContractId?: string;
}) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newName, setNewName] = useState(projectName);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await axios.delete(`/api/projects?projectId=${projectId}`);
      if (res.data.success) {
        toast.success("Project deleted successfully");
        setIsDeleteOpen(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRename = async () => {
    if (!newName.trim()) return;
    setIsRenaming(true);
    try {
      const res = await axios.patch('/api/projects', { projectId, newName });
      if (res.data.success) {
        toast.success("Project renamed successfully");
        setIsRenameOpen(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to rename project");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleRequestSignature = async () => {
    if (!draftContractId) return;
    setIsRequesting(true);
    try {
      const res = await axios.patch('/api/contracts', { contractId: draftContractId, action: "request_signatures" });
      if (res.data.success) {
        toast.success("Signature requested successfully");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to request signature");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsRenameOpen(true); }}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Rename</span>
          </DropdownMenuItem>
          {draftContractId && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRequestSignature(); }} disabled={isRequesting}>
              <FileSignature className="mr-2 h-4 w-4" />
              <span>{isRequesting ? "Requesting..." : "Request Signature"}</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            onClick={(e) => { e.stopPropagation(); setIsDeleteOpen(true); }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete project</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* RENAME DIALOG */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Enter a new name for your project. This will be visible to your client.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)} disabled={isRenaming}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={isRenaming || !newName.trim()}>
              {isRenaming ? "Renaming..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT DIALOG */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              <strong> {projectName}</strong> along with all of its contracts, deliverables, files, and activity logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleDelete(); }} 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
