"use client"

import * as React from "react"
import { ProjectTableItem } from "./projects-table-types"
import { ProjectsSearchFilters } from "./projects-search-filters"
import { WorkspaceEmptyState, FilterEmptyState } from "./projects-empty-state"
import { ProjectsTableRow } from "./projects-table-row"

export type { ProjectTableItem }

interface ProjectsTableClientProps {
  projects: ProjectTableItem[]
}

export function ProjectsTableClient({ projects }: ProjectsTableClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "completed">("all")

  // Filter projects based on search query and status tab
  const filteredProjects = React.useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus =
        statusFilter === "all" ? true : p.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [projects, searchQuery, statusFilter])

  const activeCount = projects.filter((p) => p.status === "active").length
  const completedCount = projects.filter((p) => p.status === "completed").length

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Status Filter Controls */}
      <ProjectsSearchFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        totalCount={projects.length}
        activeCount={activeCount}
        completedCount={completedCount}
      />

      {/* Concentric Radii Outer Container */}
      <div className="flex flex-col rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
        <div className="overflow-hidden rounded-md bg-white dark:bg-neutral-950">
          {projects.length === 0 ? (
            <WorkspaceEmptyState />
          ) : filteredProjects.length === 0 ? (
            <FilterEmptyState
              searchQuery={searchQuery}
              onClear={() => {
                setSearchQuery("")
                setStatusFilter("all")
              }}
            />
          ) : (
            /* Minimalist Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-neutral-50/50 dark:bg-neutral-900/50">
                    <th className="px-5 py-3">Project</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Deliverables</th>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredProjects.map((project) => (
                    <ProjectsTableRow key={project.id} project={project} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
