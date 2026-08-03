"use client";

import { ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Check, XCircle, Send } from "lucide-react";

export function DeliverableActions({ 
  deliverableId, 
  status, 
  role 
}: { 
  deliverableId: string, 
  status: string, 
  role: string 
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [comment, setComment] = useState("");
  const router = useRouter();

  const handleStatusChange = async (newStatus: "in_review" | "approved") => {
    setIsUpdating(true);
    try {
      const res = await axios.patch('/api/deliverables', { deliverableId, status: newStatus });
      if (res.data.success) {
        toast.success(newStatus === 'approved' ? "Deliverable approved!" : "Submitted for review");
        router.refresh();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error || "Failed to update status");
      } else {
        toast.error("Failed to update status");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please provide a reason for the revision");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await axios.patch('/api/deliverables', { deliverableId, status: "revision_requested", comment });
      if (res.data.success) {
        toast.success("Revision requested");
        setIsRevisionOpen(false);
        setComment("");
        router.refresh();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error || "Failed to request revision");
      } else {
        toast.error("Failed to request revision");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Owner Actions
  if (role === 'owner') {
    if (status === 'pending' || status === 'revision_requested') {
      return (
        <Button size="sm" onClick={() => handleStatusChange("in_review")} disabled={isUpdating} className="gap-2">
          <Send className="w-4 h-4" />
          Submit for Review
        </Button>
      );
    }
    return null;
  }

  // Client Actions
  if (role === 'client') {
    if (status === 'in_review') {
      return (
        <div className="flex items-center gap-2">
          <Dialog open={isRevisionOpen} onOpenChange={setIsRevisionOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive">
                <XCircle className="w-4 h-4" />
                Request Revision
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleRequestRevision}>
                <DialogHeader>
                  <DialogTitle>Request Revision</DialogTitle>
                  <DialogDescription>
                    Provide clear feedback on what needs to be changed before you can approve this deliverable.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="comment">Feedback / Reason *</Label>
                    <Textarea
                      id="comment"
                      value={comment}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        setComment(e.target.value)
                      }
                      placeholder="The logo color doesn't match the brand guidelines..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsRevisionOpen(false)} disabled={isUpdating}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive" disabled={isUpdating}>
                    {isUpdating ? "Submitting..." : "Submit Revision Request"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button size="sm" onClick={() => handleStatusChange("approved")} disabled={isUpdating} className="gap-2 bg-emerald-500 hover:bg-emerald-600">
            <Check className="w-4 h-4" />
            Approve
          </Button>
        </div>
      );
    }
    return null;
  }

  return null;
}
