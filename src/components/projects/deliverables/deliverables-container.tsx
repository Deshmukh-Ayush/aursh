"use client";

import { useState, useEffect } from "react";
import { LayoutList, LayoutGrid, GanttChartSquare } from "lucide-react";
import dynamic from "next/dynamic";
import { DeliverableList } from "./deliverable-list";

const KanbanBoard = dynamic(() => import("./kanban-board").then(mod => mod.KanbanBoard), { ssr: false });
const TimelineView = dynamic(() => import("./timeline-view").then(mod => mod.TimelineView), { ssr: false });

const VIEW_MODES = [
  { id: "list" as const, label: "List", icon: LayoutList },
  { id: "board" as const, label: "Board", icon: LayoutGrid },
  { id: "timeline" as const, label: "Timeline", icon: GanttChartSquare },
];

import { DeliverableItem } from "./types";

export function DeliverablesContainer({ 
  deliverables, 
  allComments, 
  memberRole, 
  projectId,
  userId
}: { 
  deliverables: DeliverableItem[];
  allComments: any[];
  memberRole: string;
  projectId: string;
  userId: string;
}) {
  const [viewMode, setViewMode] = useState<"list" | "board" | "timeline">("list");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("scrunity_deliverables_view");
    if (saved === "board" || saved === "list" || saved === "timeline") {
      setViewMode(saved);
    }
  }, []);

  const toggleView = (mode: "list" | "board" | "timeline") => {
    setViewMode(mode);
    localStorage.setItem("scrunity_deliverables_view", mode);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {VIEW_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => toggleView(mode.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium
                  transition-[background-color,color,box-shadow] 
                  active:scale-[0.96] transition-transform
                  ${isActive
                    ? "bg-background text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {viewMode === "list" && (
        <DeliverableList 
          deliverables={deliverables} 
          allComments={allComments} 
          memberRole={memberRole} 
          projectId={projectId} 
          userId={userId} 
        />
      )}
      {viewMode === "board" && (
        <KanbanBoard 
          deliverables={deliverables} 
          allComments={allComments} 
          memberRole={memberRole} 
          projectId={projectId} 
        />
      )}
      {viewMode === "timeline" && (
        <TimelineView 
          deliverables={deliverables} 
          allComments={allComments} 
          memberRole={memberRole} 
          projectId={projectId} 
          userId={userId} 
        />
      )}
    </div>
  );
}
