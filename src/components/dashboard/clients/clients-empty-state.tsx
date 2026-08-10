"use client"

import { Users } from "lucide-react"
import { CreateProjectDialog } from "@/components/create-project-dialog"

export function WorkspaceClientEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand mb-4">
        <Users className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">No clients yet</h3>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm">
        Clients join your workspace when you invite them to collaborate on projects and contracts.
      </p>
      <div className="mt-5">
        <CreateProjectDialog />
      </div>
    </div>
  )
}

interface FilterClientEmptyStateProps {
  searchQuery: string
  onClear: () => void
}

export function FilterClientEmptyState({ searchQuery, onClear }: FilterClientEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <h3 className="text-sm font-medium text-foreground">No matching clients</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        No clients match &quot;{searchQuery}&quot;. Try clearing your search or filter.
      </p>
      <button
        onClick={onClear}
        className="mt-4 text-xs font-semibold text-brand hover:text-brand-hover hover:underline active:scale-[0.96] transition-transform"
      >
        Clear filters
      </button>
    </div>
  )
}
