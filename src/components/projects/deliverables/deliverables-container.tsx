"use client";

import { LayoutList, LayoutGrid } from "lucide-react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { DeliverableList } from "./deliverable-list";
import { DeliverableItem } from "./types";
import { useUIStore, DeliverableViewMode } from "@/store/ui-store";

const KanbanBoard = dynamic(() => import("./kanban-board").then((mod) => mod.KanbanBoard), { ssr: false });

const VIEW_MODES = [
  { id: "list" as const, label: "List", icon: LayoutList },
  { id: "board" as const, label: "Board", icon: LayoutGrid },
];

export function DeliverablesContainer({
  deliverables,
  allComments,
  memberRole,
  projectId,
  userId,
}: {
  deliverables: DeliverableItem[];
  allComments: any[];
  memberRole: string;
  projectId: string;
  userId: string;
}) {
  const viewMode = useUIStore((state) => state.deliverableViewMode);
  const setDeliverableViewMode = useUIStore((state) => state.setDeliverableViewMode);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border/40 w-fit">
          {VIEW_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setDeliverableViewMode(mode.id as DeliverableViewMode)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="deliverable-view-pill"
                    className="absolute inset-0 bg-background rounded-lg shadow-xs border border-border/60"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{mode.label}</span>
                </span>
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
    </div>
  );
}
