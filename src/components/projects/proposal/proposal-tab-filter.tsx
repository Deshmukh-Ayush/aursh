"use client";

import { motion } from "framer-motion";

interface ProposalTabFilterProps {
  activeTab: string;
  onTabChange: (tab: "all" | "draft" | "sent" | "accepted" | "declined") => void;
  tabs: { id: string; label: string; count: number }[];
}

export function ProposalTabFilter({ activeTab, onTabChange, tabs }: ProposalTabFilterProps) {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/40 w-fit max-w-full overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as any)}
            className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="proposal-tab-pill"
                className="absolute inset-0 bg-background rounded-lg shadow-xs border border-border/60"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.label}
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] tabular-nums ${
                  isActive ? "bg-primary/15 text-primary font-bold" : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
