"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface SlidingPillTabItem<T extends string> {
  id: T
  label: string
  count?: number
  icon?: React.ElementType
}

export interface SlidingPillTabsProps<T extends string> {
  layoutId: string
  tabs: SlidingPillTabItem<T>[]
  activeTab: T
  onChange: (tabId: T) => void
  className?: string
}

export function SlidingPillTabs<T extends string>({
  layoutId,
  tabs,
  activeTab,
  onChange,
  className,
}: SlidingPillTabsProps<T>) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-1 overflow-x-auto rounded-full border border-border/40 bg-muted/50 p-1 hide-scrollbar",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative z-10 flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1 text-xs font-medium transition-colors active:scale-[0.96]",
              isActive ? "text-white font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-full bg-brand shadow-xs"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            {Icon && <Icon className="h-3.5 w-3.5" />}
            <span>
              {tab.label}
              {tab.count !== undefined ? ` (${tab.count})` : ""}
            </span>
          </button>
        )
      })}
    </div>
  )
}
