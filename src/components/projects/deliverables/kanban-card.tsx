import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, isPast } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, CheckCircle2, Clock, Eye, AlertCircle, Edit, Pencil } from "lucide-react";
import { DeliverableItem } from "./types";
import { Button } from "@/components/ui/button";

interface KanbanCardProps {
  item: DeliverableItem;
  comments: number;
  disabled: boolean;
  memberRole: string;
  onEdit?: (item: DeliverableItem) => void;
}

function SortableItemComponent({ item, comments, disabled, memberRole, onEdit }: KanbanCardProps) {
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
      className={`cursor-grab active:cursor-grabbing transition-transform ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <Card className="group shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.04)] border-0 hover:shadow-[0_3px_10px_rgba(0,0,0,0.07)] dark:hover:shadow-[0_3px_10px_rgba(0,0,0,0.3)] transition-shadow relative">
        <CardHeader className="p-3 pb-2 pr-8">
          <CardTitle className="text-[13px] font-semibold line-clamp-2 leading-snug tracking-tight">{item.title}</CardTitle>
          {item.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
          )}
          {memberRole === 'owner' && onEdit && (
            <Button
               variant="ghost"
               size="icon"
               className="absolute top-1.5 right-1.5 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
               onPointerDown={(e) => {
                 // Prevent drag start
                 e.stopPropagation();
                 onEdit(item);
               }}
            >
               <Pencil className="w-3 h-3 text-muted-foreground" />
            </Button>
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

export const KanbanCard = React.memo(SortableItemComponent);
