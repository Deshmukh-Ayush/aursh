"use client";

import { useState } from "react";
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
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateDeliverableStatusAction } from "@/app/actions/deliverable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, AlertCircle } from "lucide-react";
import { format, isPast } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const COLUMNS = [
  { id: "pending", title: "Pending", color: "text-muted-foreground", dotColor: "bg-muted-foreground" },
  { id: "in_review", title: "In Review", color: "text-blue-500", dotColor: "bg-blue-500" },
  { id: "revision_requested", title: "Needs Revision", color: "text-red-500", dotColor: "bg-red-500" },
  { id: "approved", title: "Approved", color: "text-emerald-500", dotColor: "bg-emerald-500" }
];

function SortableItem({ item, comments, disabled }: { item: any, comments: number, disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isOverdue = item.dueDate && isPast(new Date(item.dueDate)) && item.status !== 'approved';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className={`cursor-grab active:cursor-grabbing active:scale-[0.96] transition-transform ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.04)] border-0 hover:shadow-[0_3px_10px_rgba(0,0,0,0.07)] dark:hover:shadow-[0_3px_10px_rgba(0,0,0,0.3)] transition-shadow">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-[13px] font-semibold line-clamp-2 leading-snug tracking-tight">{item.title}</CardTitle>
          {item.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
          )}
        </CardHeader>
        <CardContent className="p-3 pt-0 flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-2.5">
            {item.dueDate && (
              <div className={`flex items-center gap-1 text-[10px] tabular-nums ${isOverdue ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                <Calendar className="w-3 h-3 shrink-0" />
                {format(new Date(item.dueDate), 'MMM d')}
              </div>
            )}
            {comments > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
                <MessageSquare className="w-3 h-3 shrink-0" />
                {comments}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function KanbanBoard({ 
  deliverables: initialDeliverables, 
  allComments, 
  memberRole, 
  projectId
}: { 
  deliverables: any[];
  allComments: any[];
  memberRole: string;
  projectId: string;
}) {
  const [items, setItems] = useState(initialDeliverables);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Revision Comment Dialog State
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionComment, setRevisionComment] = useState("");
  const [pendingRevisionUpdate, setPendingRevisionUpdate] = useState<{ id: string, status: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const executeStatusUpdate = async (id: string, newStatus: string, comment?: string) => {
    const previousItems = [...items];
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, status: newStatus } : item));

    const res = await updateDeliverableStatusAction(id, newStatus as any, comment);
    
    if (res?.error) {
      toast.error(res.error);
      setItems(previousItems); // revert
    } else {
      toast.success(`Moved to ${COLUMNS.find(c => c.id === newStatus)?.title}`);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
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
      if (newStatus !== 'in_review') {
        toast.error("Clients can only submit items for review.");
        return;
      }
      if (activeItem.status !== 'pending' && activeItem.status !== 'revision_requested') {
        toast.error("Item cannot be submitted for review from this state.");
        return;
      }
    }

    if (memberRole === 'owner') {
      if (newStatus !== 'in_review') {
         if (newStatus !== 'in_review') {
           toast.error("Owners can only move to In Review right now.");
           return;
         }
      }
    }

    if (newStatus === "revision_requested") {
      setPendingRevisionUpdate({ id: activeItem.id, status: newStatus });
      setRevisionDialogOpen(true);
      return;
    }

    await executeStatusUpdate(activeItem.id, newStatus);
  };

  const activeItem = items.find((item) => item.id === activeId);

  return (
    <div className="w-full h-full pb-10">
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
              <div key={column.id} className="flex flex-col gap-2.5 bg-muted/20 p-3 rounded-xl min-h-[420px] min-w-[260px] w-[260px] lg:w-full lg:min-w-0 flex-1 snap-center shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${column.dotColor}`} />
                    <span className={`text-[13px] font-semibold ${column.color}`}>{column.title}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">{columnItems.length}</span>
                </div>
                
                <SortableContext 
                  id={column.id}
                  items={columnItems.map(i => i.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-2.5 min-h-[100px]">
                    {columnItems.map((item) => {
                      const commentsCount = allComments.filter(c => c.comment.deliverableId === item.id).length;
                      // Constraints UI
                      const canDrag = memberRole === 'client' 
                        ? (item.status === 'pending' || item.status === 'revision_requested')
                        : true;

                      return (
                        <SortableItem key={item.id} item={item} comments={commentsCount} disabled={!canDrag} />
                      );
                    })}
                    {columnItems.length === 0 && (
                      <div className="flex items-center justify-center h-20 text-[11px] text-muted-foreground/50 border border-dashed border-border/30 rounded-lg">
                        Drop here
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>
        
        <DragOverlay>
          {activeItem ? (
            <div className="opacity-90 rotate-1 scale-[1.02] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <SortableItem item={activeItem} comments={0} disabled={false} />
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
            <Button variant="outline" onClick={() => setRevisionDialogOpen(false)} className="active:scale-[0.96] transition-transform">Cancel</Button>
            <Button 
              className="active:scale-[0.96] transition-transform"
              onClick={() => {
                if (pendingRevisionUpdate) {
                  executeStatusUpdate(pendingRevisionUpdate.id, pendingRevisionUpdate.status, revisionComment);
                }
                setRevisionDialogOpen(false);
                setRevisionComment("");
              }}
            >Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
