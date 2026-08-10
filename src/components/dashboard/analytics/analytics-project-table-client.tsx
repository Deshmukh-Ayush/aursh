"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, AlertTriangle, CheckCircle2, Clock } from "lucide-react"

export interface AnalyticsProjectPerformanceItem {
  id: string
  name: string
  description: string | null
  totalValue: number | null
  proposalStatus: string | null
  approvedDeliverables: number
  totalDeliverables: number
  revisionRequests: number
  members: {
    id: string
    name: string | null
    email: string
    image: string | null
  }[]
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`
}

export function AnalyticsProjectTableClient({
  projects,
}: {
  projects: AnalyticsProjectPerformanceItem[]
}) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col rounded-md border border-border/40 bg-white p-6 shadow-xs dark:bg-neutral-950 text-center">
        <h3 className="text-sm font-semibold text-foreground">No active project performance data</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Create projects and proposals to track workspace analytics.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <div className="overflow-hidden rounded-md bg-white dark:bg-neutral-950">
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Project Performance & Scope Health
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Financial value, deliverable completion, and revision friction per project.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-neutral-50/50 dark:bg-neutral-900/50">
                <th className="px-5 py-3">Project</th>
                <th className="px-4 py-3">Contract Value</th>
                <th className="px-4 py-3">Deal Status</th>
                <th className="px-4 py-3">Deliverables</th>
                <th className="px-4 py-3">Scope Friction</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {projects.map((p) => {
                const completionPct =
                  p.totalDeliverables > 0
                    ? Math.round((p.approvedDeliverables / p.totalDeliverables) * 100)
                    : 0

                return (
                  <tr
                    key={p.id}
                    className="group transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40"
                  >
                    {/* Project Info */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-semibold text-foreground hover:text-brand hover:underline truncate text-sm transition-colors"
                        >
                          {p.name}
                        </Link>
                        {p.description ? (
                          <span className="text-xs text-muted-foreground truncate max-w-xs">
                            {p.description}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Value */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-foreground tabular-nums">
                      {p.totalValue ? formatCurrency(p.totalValue) : "--"}
                    </td>

                    {/* Deal Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {p.proposalStatus === "accepted" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Won
                        </span>
                      ) : p.proposalStatus === "sent" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {p.proposalStatus || "Draft"}
                        </span>
                      )}
                    </td>

                    {/* Deliverables Progress */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1 w-28">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="tabular-nums">
                            {p.approvedDeliverables}/{p.totalDeliverables}
                          </span>
                          <span className="tabular-nums font-semibold text-foreground">
                            {completionPct}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-brand transition-all duration-300"
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Scope Friction (Revision Requests) */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {p.revisionRequests > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                          <AlertTriangle className="h-3 w-3" />
                          {p.revisionRequests} Revisions
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">
                          0 Revisions
                        </span>
                      )}
                    </td>

                    {/* Team Avatars */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {p.members.slice(0, 3).map((m) => (
                          <div
                            key={m.id}
                            className="relative h-6 w-6 rounded-full border-2 border-background bg-muted overflow-hidden"
                            title={m.name || m.email}
                          >
                            {m.image ? (
                              <Image src={m.image} alt={m.name || "User"} fill className="object-cover" unoptimized />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-brand bg-brand/10">
                                {(m.name || m.email).charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Action Link */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/projects/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover transition-colors active:scale-[0.96] origin-center"
                      >
                        <span>Open project</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
