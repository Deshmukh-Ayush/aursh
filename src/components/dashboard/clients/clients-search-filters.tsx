"use client"

import { Search } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type FilterType = "all" | "active" | "invited"

interface ClientsSearchFiltersProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  statusFilter: FilterType
  setStatusFilter: (filter: FilterType) => void
  totalCount: number
  activeCount: number
  invitedCount: number
}

const filters: { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "invited", label: "Invited" },
]

export function ClientsSearchFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  totalCount,
  activeCount,
  invitedCount,
}: ClientsSearchFiltersProps) {
  const getCount = (id: FilterType) => {
    if (id === "all") return totalCount
    if (id === "active") return activeCount
    return invitedCount
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search clients..."
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 transition-shadow"
        />
      </div>

      {/* Sliding Pill Filter Tabs */}
      <div className="relative flex items-center gap-1 rounded-full border border-border/40 bg-muted/50 p-1">
        {filters.map((tab) => {
          const isActive = statusFilter === tab.id
          const count = getCount(tab.id)

          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "relative z-10 rounded-full px-3.5 py-1 text-xs font-medium transition-colors active:scale-[0.96]",
                isActive ? "text-white font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeClientsFilterPill"
                  className="absolute inset-0 -z-10 rounded-full bg-brand shadow-xs"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span>
                {tab.label} ({count})
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
