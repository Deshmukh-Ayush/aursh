"use client"

import { CheckCircle2, Clock } from "lucide-react"

interface ProjectsStatusBadgeProps {
  status: string
}

export function ProjectsStatusBadge({ status }: ProjectsStatusBadgeProps) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    )
  }

  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-400">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <Clock className="h-3 w-3" />
      {status}
    </span>
  )
}
