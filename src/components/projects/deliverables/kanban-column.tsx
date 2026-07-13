import React from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./kanban-card";

interface KanbanColumnProps {
  column: {
    id: string;
    title: string;
    color: string;
    dotColor: string;
  };
  items: any[];
  allComments: any[];
  memberRole: string;
  onEdit?: (item: any) => void;
}

export function KanbanColumn({ column, items, allComments, memberRole, onEdit }: KanbanColumnProps) {
  return (
    <div className="flex flex-col gap-2.5 bg-muted/20 p-3 rounded-xl min-h-[420px] min-w-[260px] w-[260px] lg:w-full lg:min-w-0 flex-1 snap-center shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${column.dotColor}`} />
          <span className={`text-[13px] font-semibold ${column.color}`}>{column.title}</span>
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">{items.length}</span>
      </div>
      
      <SortableContext 
        id={column.id}
        items={items.map(i => i.id)} 
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2.5 min-h-[100px] h-full">
          {items.map((item) => {
            const commentsCount = allComments.filter(c => c.comment.deliverableId === item.id).length;
            
            // Allow drag logic
            let canDrag = false;
            if (memberRole === 'owner') {
               canDrag = true; // Owner can drag anything, we validate drop instead
            } else if (memberRole === 'client') {
               canDrag = item.status === 'in_review'; // Client can only review items in review
            }

            return (
              <KanbanCard 
                key={item.id} 
                item={item} 
                comments={commentsCount} 
                disabled={!canDrag} 
                memberRole={memberRole}
                onEdit={onEdit}
              />
            );
          })}
          {items.length === 0 && (
            <div className="flex items-center justify-center h-20 text-[11px] text-muted-foreground/50 border border-dashed border-border/30 rounded-lg">
              Drop here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
