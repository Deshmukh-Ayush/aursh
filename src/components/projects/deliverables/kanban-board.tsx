"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragEndEvent 
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { KanbanColumn } from "./kanban-column";
import { DeliverableItem } from "./types";
import { KanbanCard } from "./kanban-card";

const COLUMNS = [
  { id: "pending", title: "Pending", color: "text-muted-foreground", dotColor: "bg-muted-foreground" },
  { id: "in_review", title: "In Review", color: "text-blue-500", dotColor: "bg-blue-500" },
  { id: "revision_requested", title: "Needs Revision", color: "text-red-500", dotColor: "bg-red-500" },
  { id: "approved", title: "Approved", color: "text-emerald-500", dotColor: "bg-emerald-500" }
];

interface KanbanBoardProps {
  deliverables: DeliverableItem[];
  allComments: any[];
  memberRole: string;
  projectId: string;
}

export function KanbanBoard({ 
  deliverables: initialDeliverables, 
  allComments, 
  memberRole, 
  projectId
}: KanbanBoardProps) {
  const [items, setItems] = useState<DeliverableItem[]>(initialDeliverables);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Revision Comment Dialog State
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionComment, setRevisionComment] = useState("");
  const [pendingRevisionUpdate, setPendingRevisionUpdate] = useState<{ id: string, status: string } | null>(null);
  
  // Submission Drawer State
  const [submissionDrawerOpen, setSubmissionDrawerOpen] = useState(false);
  const [submissionTitle, setSubmissionTitle] = useState("");
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [pendingSubmissionUpdate, setPendingSubmissionUpdate] = useState<{ id: string, status: string } | null>(null);

  // Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const router = useRouter();

  // Reset local state if initial data changes and we're not dirty
  useEffect(() => {
    if (!isDirty) {
      setItems(initialDeliverables);
    }
  }, [initialDeliverables, isDirty]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleStatusUpdate = (id: string, newStatus: string) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, status: newStatus } : item));
    setIsDirty(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeItem = items.find((item) => item.id === active.id);
    if (!activeItem) return;

    const overId = over.id as string;
    let newStatus = overId;

    // If dropped on another item, get that item's status
    const overItem = items.find((item) => item.id === overId);
    if (overItem) {
      newStatus = overItem.status;
    }

    if (activeItem.status === newStatus) return;

    // Constraints Validation
    if (memberRole === 'client') {
      if (newStatus !== 'revision_requested' && newStatus !== 'approved') {
        toast.error("Clients can only move items to Needs Revision or Approved.");
        return;
      }
    }

    if (memberRole === 'owner') {
      // Owner can move freely, but let's warn if they move to approved without client review, although allowed.
    }

    if (newStatus === "revision_requested") {
      setPendingRevisionUpdate({ id: activeItem.id, status: newStatus });
      setRevisionDialogOpen(true);
      return;
    }

    if (newStatus === "in_review" && activeItem.status !== "in_review") {
      setPendingSubmissionUpdate({ id: activeItem.id, status: newStatus });
      setSubmissionTitle(activeItem.title || "");
      setSubmissionUrl(activeItem.submissionUrl || "");
      setSubmissionNote(activeItem.submissionNote || "");
      setSubmissionDrawerOpen(true);
      return;
    }

    handleStatusUpdate(activeItem.id, newStatus);
  };

  const handleSaveBulk = async () => {
    setIsSaving(true);
    try {
      const updates = items.filter(item => {
        const initial = initialDeliverables.find((i: DeliverableItem) => i.id === item.id);
        return !initial || 
               initial.status !== item.status || 
               initial.title !== item.title || 
               initial.description !== item.description || 
               initial.dueDate !== item.dueDate ||
               initial.submissionTitle !== item.submissionTitle ||
               initial.submissionUrl !== item.submissionUrl ||
               initial.submissionNote !== item.submissionNote;
      }).map(item => ({
        id: item.id,
        status: item.status,
        title: item.title,
        description: item.description,
        dueDate: item.dueDate,
        submissionTitle: item.submissionTitle,
        submissionUrl: item.submissionUrl,
        submissionNote: item.submissionNote
      }));

      if (updates.length > 0) {
        const res = await axios.patch('/api/deliverables/bulk', { updates });
        if (res.data.success) {
          toast.success("Board saved successfully");
          setIsDirty(false);
          router.refresh();
        }
      } else {
        setIsDirty(false);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error || "Failed to save board");
      } else {
        toast.error("Failed to save board");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBulk = () => {
    setItems(initialDeliverables);
    setIsDirty(false);
  };

  const activeItem = useMemo(() => items.find((item) => item.id === activeId), [items, activeId]);

  return (
    <div className="w-full h-full pb-10 flex flex-col relative">
      {/* Floating Save/Cancel Toolbar */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background/95 backdrop-blur-md border shadow-lg px-4 py-3 rounded-full animate-in slide-in-from-bottom-5">
           <span className="text-sm font-medium px-2">Unsaved changes</span>
           <Button variant="outline" size="sm" onClick={handleCancelBulk} disabled={isSaving} className="rounded-full">Cancel</Button>
           <Button size="sm" onClick={handleSaveBulk} disabled={isSaving} className="rounded-full">{isSaving ? "Saving..." : "Save Changes"}</Button>
        </div>
      )}

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
      >
        <div className="flex overflow-x-auto pb-6 gap-4 items-start snap-x snap-mandatory scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {COLUMNS.map((column) => {
            const columnItems = items.filter((item) => item.status === column.id);
            return (
              <KanbanColumn 
                key={column.id} 
                column={column} 
                items={columnItems} 
                allComments={allComments} 
                memberRole={memberRole} 
                onEdit={memberRole === 'owner' ? (item) => {
                  setEditingItem({ ...item, dueDate: item.dueDate ? String(item.dueDate).split('T')[0] : "" });
                  setEditDialogOpen(true);
                } : undefined}
              />
            );
          })}
        </div>
        
        <DragOverlay>
          {activeItem ? (
            <div className="opacity-90 rotate-1 scale-[1.02] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <KanbanCard 
                item={activeItem} 
                comments={0} 
                disabled={false} 
                memberRole={memberRole} 
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>Please provide a reason or feedback for this revision.</DialogDescription>
          </DialogHeader>
          <Textarea 
            placeholder="What needs to be changed?" 
            value={revisionComment} 
            onChange={(e) => setRevisionComment(e.target.value)} 
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevisionDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={async () => {
                if (pendingRevisionUpdate) {
                  // We also need to save the comment. Since the UI wants a "Save Board" flow, 
                  // but comments are discrete actions. We should probably send the comment immediately via API
                  // or just attach it. For now, since comments map to deliverables, we will send it immediately
                  // to keep the thread alive, but mark the item as dirty.
                  if (revisionComment.trim()) {
                     try {
                        await axios.post('/api/comments', {
                           deliverableId: pendingRevisionUpdate.id,
                           body: revisionComment
                        });
                     } catch(e) {}
                  }
                  handleStatusUpdate(pendingRevisionUpdate.id, pendingRevisionUpdate.status);
                }
                setRevisionDialogOpen(false);
                setRevisionComment("");
              }}
            >Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Deliverable</DialogTitle>
            <DialogDescription>Update the details and due date.</DialogDescription>
          </DialogHeader>
          {editingItem && (
             <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                   <Label htmlFor="title">Title</Label>
                   <Input id="title" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} />
                </div>
                <div className="grid gap-2">
                   <Label htmlFor="description">Description</Label>
                   <Textarea id="description" value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                </div>
                <div className="grid gap-2">
                   <Label htmlFor="dueDate">Due Date</Label>
                   <Input id="dueDate" type="date" value={editingItem.dueDate} onChange={e => setEditingItem({...editingItem, dueDate: e.target.value})} />
                </div>
             </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (editingItem) {
                  setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...editingItem } : i));
                  setIsDirty(true);
                  setEditDialogOpen(false);
                }
              }}
            >Save to Draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Drawer direction="left" open={submissionDrawerOpen} onOpenChange={setSubmissionDrawerOpen}>
        <DrawerContent className="w-full max-w-sm sm:max-w-sm">
          <DrawerHeader className="text-left">
            <DrawerTitle>Submit Deliverable</DrawerTitle>
            <DrawerDescription>Attach your work and add any notes for the client.</DrawerDescription>
          </DrawerHeader>
          
          <div className="flex flex-col gap-5 p-4 py-2 overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="sub-title">Submission Title <span className="text-destructive">*</span></Label>
              <Input 
                id="sub-title" 
                placeholder="e.g. Final Wireframes v1" 
                value={submissionTitle} 
                onChange={(e) => setSubmissionTitle(e.target.value)} 
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="sub-url">Attachment URL <span className="text-muted-foreground font-normal">(Optional)</span></Label>
              <Input 
                id="sub-url" 
                type="url"
                placeholder="https://figma.com/..." 
                value={submissionUrl} 
                onChange={(e) => setSubmissionUrl(e.target.value)} 
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sub-note">Note <span className="text-muted-foreground font-normal">(Optional)</span></Label>
              <Textarea 
                id="sub-note" 
                placeholder="Briefly describe what you're submitting..." 
                value={submissionNote} 
                onChange={(e) => setSubmissionNote(e.target.value)} 
                rows={5}
                className="resize-none"
              />
            </div>
          </div>

          <DrawerFooter className="pt-4">
            <Button 
              disabled={!submissionTitle.trim()}
              onClick={() => {
                if (pendingSubmissionUpdate && submissionTitle.trim()) {
                  setItems((prev) => prev.map((item) => item.id === pendingSubmissionUpdate.id ? { 
                    ...item, 
                    status: pendingSubmissionUpdate.status,
                    submissionTitle,
                    submissionUrl,
                    submissionNote
                  } : item));
                  setIsDirty(true);
                  setSubmissionDrawerOpen(false);
                }
              }}
            >
              Submit for Review
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
