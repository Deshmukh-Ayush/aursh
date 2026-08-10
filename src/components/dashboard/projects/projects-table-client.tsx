"use client"

import * as React from "react"
import { ProjectTableItem } from "./projects-table-types"
import { ProjectsSearchFilters } from "./projects-search-filters"
import { WorkspaceEmptyState, FilterEmptyState } from "./projects-empty-state"
import { ProjectsTableRow } from "./projects-table-row"
import { DataTableShell } from "@/components/dashboard/shared/data-table-shell"

export type { ProjectTableItem }

interface ProjectsTableClientProps {
  projects: ProjectTableItem[]
}

const TABLE_HEADERS = ["Project", "Status", "Contract Value", "Deliverables", "Team", "Updated", "Action"]

export function ProjectsTableClient({ projects }: ProjectsTableClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "completed">("all")

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

      {/* Table Container */}
      {projects.length === 0 ? (
        <div className="rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
          <div className="rounded-md bg-white dark:bg-neutral-950">
            <WorkspaceEmptyState />
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
          <div className="rounded-md bg-white dark:bg-neutral-950">
            <FilterEmptyState
              searchQuery={searchQuery}
              onClear={() => {
                setSearchQuery("")
                setStatusFilter("all")
              }}
            />
          </div>
        </div>
      ) : (
        <DataTableShell headers={TABLE_HEADERS}>
          {filteredProjects.map((project) => (
            <ProjectsTableRow key={project.id} project={project} />
          ))}
        </DataTableShell>
      )}
    </div>
  )
}
