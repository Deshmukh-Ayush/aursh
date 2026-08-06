"use client";

import { motion } from "framer-motion";
import type { MilestoneWithDetails, PaymentsTab, PaymentsTabKey } from "./types";

type PaymentsTabsProps = {
  activeTab: string;
  onTabChange: (tab: PaymentsTabKey) => void;
  milestones: MilestoneWithDetails[];
  tabs: PaymentsTab[];
};

export function PaymentsTabs({ activeTab, onTabChange, milestones, tabs }: PaymentsTabsProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <nav className="relative p-1 rounded-full bg-muted/60 dark:bg-neutral-900/80 border border-border/40 inline-flex gap-1 shadow-xs overflow-x-auto max-w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = milestones.filter((m) => {
            if (tab.id === "all") return true;
            if (tab.id === "due") return m.status === "due" || m.status === "overdue";
            if (tab.id === "paid") return m.status === "paid";
            if (tab.id === "upcoming") return m.status === "upcoming";
            return true;
          }).length;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-150 flex items-center gap-2 z-10 select-none shrink-0 ${
                isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="payments-tab-pill"
                  className="absolute inset-0 rounded-full bg-background shadow-xs ring-1 ring-black/5 dark:ring-white/10 z-[-1]"
                  transition={{ type: "spring", duration: 0.25, bounce: 0 }}
                />
              )}
              <span>{tab.label}</span>
              <span className={`text-[10px] tabular-nums px-1.5 py-0.2 rounded-full ${isActive ? "bg-muted text-foreground" : "text-muted-foreground/60"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
