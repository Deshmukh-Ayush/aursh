"use client"

import { cn } from "@/lib/utils"

export interface MonospaceMetricStatProps {
  tag: string
  value: string | number
  subtext?: string
  className?: string
}

export function MonospaceMetricStat({
  tag,
  value,
  subtext,
  className,
}: MonospaceMetricStatProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-[11px] text-muted-foreground font-mono block uppercase">
        {tag}
      </span>
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {value}{" "}
        {subtext ? (
          <span className="text-xs text-muted-foreground font-normal">{subtext}</span>
        ) : null}
      </span>
    </div>
  )
}
