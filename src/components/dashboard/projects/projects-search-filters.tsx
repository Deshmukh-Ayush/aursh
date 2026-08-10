"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectsSearchFiltersProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  statusFilter: "all" | "active" | "completed"
  setStatusFilter: (filter: "all" | "active" | "completed") => void
  totalCount: number
  activeCount: number
  completedCount: number
}

export function ProjectsSearchFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  totalCount,
  activeCount,
  completedCount,
}: ProjectsSearchFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects..."
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-1 rounded-md border border-border/40 bg-muted/40 p-1">
        <button
          onClick={() => setStatusFilter("all")}
          className={cn(
            "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
            statusFilter === "all"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          All ({totalCount})
        </button>
        <button
          onClick={() => setStatusFilter("active")}
          className={cn(
            "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
            statusFilter === "active"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setStatusFilter("completed")}
          className={cn(
            "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
            statusFilter === "completed"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Completed ({completedCount})
        </button>
      </div>
    </div>
  )
}
