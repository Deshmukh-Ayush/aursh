"use client";

import { useState, useRef, useEffect } from "react";
import { format, differenceInDays, addDays, isPast } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckCircle2, Eye, AlertCircle, Hourglass, Edit } from "lucide-react";
import { DeliverableItem } from "./types";

const STATUS_CONFIG: Record<string, { label: string; bg: string; bar: string; text: string; icon: typeof CheckCircle2 }> = {
  approved: { label: "Approved", bg: "bg-emerald-500/8", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  in_review: { label: "In Review", bg: "bg-blue-500/8", bar: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", icon: Eye },
  revision_requested: { label: "Revision", bg: "bg-red-500/8", bar: "bg-red-500", text: "text-red-600 dark:text-red-400", icon: AlertCircle },
  pending: { label: "Pending", bg: "bg-zinc-500/8", bar: "bg-zinc-400 dark:bg-zinc-500", text: "text-muted-foreground", icon: Hourglass },
};

interface TimelineBarProps {
  deliv: DeliverableItem;
  index: number;
  startDate: Date;
  totalDays: number;
  commentsCount: number;
  canEdit: boolean;
  onClick: () => void;
  onUpdateDates: (delivId: string, deltaDays: number) => void;
}

export function TimelineBar({
  deliv,
  index,
  startDate,
  totalDays,
  commentsCount,
  canEdit,
  onClick,
  onUpdateDates
}: TimelineBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetDays, setDragOffsetDays] = useState(0);
  
  const startXRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const created = new Date(deliv.createdAt);
  const originalDue = deliv.dueDate ? new Date(deliv.dueDate) : addDays(created, 7);
  
  const tempDue = addDays(originalDue, dragOffsetDays);
  
  // Actually, dragging should shift both created (start) and due (end)?
  // Usually timeline bars just shift the due date or shift the whole block.
  // The user asked to "increase decrease and change the dates from there".
  // A simple implementation is shifting the whole block (start and end).
  // But wait, `createdAt` is usually static. If they just want to change the dueDate, 
  // maybe dragging the right edge is better.
  // For simplicity: dragging the block shifts both `createdAt` and `dueDate`.
  // Wait, shifting `createdAt` is weird. Let's just shift `dueDate` if they drag, or shift both for a visual block.
  // Let's just allow shifting the whole block for now.
  const tempCreated = addDays(created, dragOffsetDays);
  
  const isOverdue = tempDue && isPast(tempDue) && deliv.status !== 'approved';

  let leftPct = Math.max(0, (differenceInDays(tempCreated, startDate) / totalDays) * 100);
  let rightPct = Math.min(100, (differenceInDays(tempDue, startDate) / totalDays) * 100);
  let widthPct = rightPct - leftPct;
  if (widthPct < 3) widthPct = 3;

  const config = STATUS_CONFIG[deliv.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canEdit || deliv.status === 'approved') return;
    
    // Check if it's the right edge to resize, or body to move
    // We will just do full move for simplicity right now
    setIsDragging(true);
    startXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerWidth = containerRef.current.parentElement?.clientWidth || 1000;
    const deltaX = e.clientX - startXRef.current;
    
    // Convert deltaX to days
    const pctDelta = deltaX / containerWidth;
    const daysDelta = Math.round(pctDelta * totalDays);
    
    setDragOffsetDays(daysDelta);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    if (dragOffsetDays !== 0) {
      onUpdateDates(deliv.id, dragOffsetDays);
      setDragOffsetDays(0);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-14 flex items-center group hover:bg-muted/30 transition-colors border-b border-border/10 last:border-0"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Background clickable area for dialog */}
      <div className="absolute inset-0 z-0 cursor-pointer" onClick={onClick} />

      {/* The bar */}
      <div
        className={`absolute h-8 rounded-md ${config.bar} transition-[opacity,transform] ${isDragging ? 'scale-y-110 opacity-90 shadow-lg' : 'group-hover:scale-y-110 origin-center'} ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{
          left: `${leftPct}%`,
          width: `${widthPct}%`,
          opacity: deliv.status === 'approved' ? 0.7 : 0.85,
          zIndex: 10
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Inner label */}
        {widthPct > 12 && (
          <div className="absolute inset-0 flex items-center px-2.5 overflow-hidden pointer-events-none">
            <span className="text-white text-[11px] font-semibold truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
              {deliv.title}
            </span>
          </div>
        )}
      </div>

      {/* Label outside bar if bar is too small */}
      {widthPct <= 12 && (
        <div
          className="absolute flex items-center gap-1.5 text-[12px] font-medium text-foreground transition-colors pointer-events-none"
          style={{ left: `calc(${leftPct + widthPct}% + 8px)`, zIndex: 1 }}
        >
          <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${config.text}`} />
          <span className="truncate max-w-[200px]">{deliv.title}</span>
        </div>
      )}

      {/* Right-side info chip */}
      <div
        className="absolute right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
      >
        {isOverdue && (
          <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20 shadow-none text-[10px] font-semibold px-1.5 py-0">
            Overdue
          </Badge>
        )}
        {commentsCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
            <MessageSquare className="w-3 h-3" />
            {commentsCount}
          </span>
        )}
        <span className={`text-[10px] font-medium ${config.text}`}>
          {config.label}
        </span>
      </div>
    </div>
  );
}
