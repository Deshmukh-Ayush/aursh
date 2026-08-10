"use client"

import * as React from "react"
import { ClientTableItem } from "./clients-table-types"
import { ClientsSearchFilters } from "./clients-search-filters"
import { WorkspaceClientEmptyState, FilterClientEmptyState } from "./clients-empty-state"
import { ClientsTableRow } from "./clients-table-row"

export type { ClientTableItem }

interface ClientsTableClientProps {
  clients: ClientTableItem[]
}

export function ClientsTableClient({ clients }: ClientsTableClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "invited">("all")

  // Filter clients based on search query and status tab
  const filteredClients = React.useMemo(() => {
    return clients.filter((c) => {
      const name = c.name || ""
      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "all" ? true : c.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [clients, searchQuery, statusFilter])

  const activeCount = clients.filter((c) => c.status === "active").length
  const invitedCount = clients.filter((c) => c.status === "invited").length

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Status Filter Controls */}
      <ClientsSearchFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        totalCount={clients.length}
        activeCount={activeCount}
        invitedCount={invitedCount}
      />

      {/* Concentric Radii Outer Container */}
      <div className="flex flex-col rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
        <div className="overflow-hidden rounded-md bg-white dark:bg-neutral-950">
          {clients.length === 0 ? (
            <WorkspaceClientEmptyState />
          ) : filteredClients.length === 0 ? (
            <FilterClientEmptyState
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
                    <th className="px-5 py-3">Client</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Projects</th>
                    <th className="px-4 py-3">Total Value</th>
                    <th className="px-4 py-3">Joined / Invited</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredClients.map((client) => (
                    <ClientsTableRow key={client.id} client={client} />
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
