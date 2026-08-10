"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ConcentricCardProps {
  label?: React.ReactNode
  icon?: React.ElementType
  badge?: React.ReactNode
  headerExtra?: React.ReactNode
  className?: string
  innerClassName?: string
  children: React.ReactNode
}

export function ConcentricCard({
  label,
  icon: Icon,
  badge,
  headerExtra,
  className,
  innerClassName,
  children,
}: ConcentricCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900",
        className
      )}
    >
      {label || badge || headerExtra ? (
        <div className="flex items-center justify-between py-0.5 px-1">
          {label ? (
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              {Icon && <Icon className="h-4 w-4 text-brand" />}
              {label}
            </span>
          ) : null}
          {badge}
          {headerExtra}
        </div>
      ) : null}
      <div
        className={cn(
          "rounded-md bg-white p-5 dark:bg-neutral-950 flex flex-col gap-4 h-full justify-between",
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}
