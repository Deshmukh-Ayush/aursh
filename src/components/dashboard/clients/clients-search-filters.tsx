"use client"

import { Search } from "lucide-react"
import { SlidingPillTabs } from "@/components/dashboard/shared/sliding-pill-tabs"

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

export function ClientsSearchFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  totalCount,
  activeCount,
  invitedCount,
}: ClientsSearchFiltersProps) {
  const tabs = [
    { id: "all" as const, label: "All", count: totalCount },
    { id: "active" as const, label: "Active", count: activeCount },
    { id: "invited" as const, label: "Invited", count: invitedCount },
  ]

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
      <SlidingPillTabs
        layoutId="activeClientsFilterPill"
        tabs={tabs}
        activeTab={statusFilter}
        onChange={setStatusFilter}
      />
    </div>
  )
}
