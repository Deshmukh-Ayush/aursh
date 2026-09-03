"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CheckCircle2, Clock } from "lucide-react"
import { format } from "date-fns"
import { ClientTableItem } from "./clients-table-types"

interface ClientsTableRowProps {
  client: ClientTableItem
}

function formatCurrency(amount: number, currency: string = "USD") {
  if (currency === "INR") return `₹${amount.toLocaleString("en-IN")}`
  return `$${amount.toLocaleString("en-US")}`
}

export function ClientsTableRow({ client }: ClientsTableRowProps) {
  return (
    <tr className="group transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40">
      {/* Client Info */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border bg-muted">
            {client.image ? (
              <Image src={client.image} alt={client.name || client.email} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-brand bg-brand/10">
                {(client.name || client.email).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-foreground truncate text-sm">
              {client.name || client.email.split("@")[0]}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-xs">
              {client.email}
            </span>
          </div>
        </div>
      </td>

      {/* Status Badge */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        {client.status === "active" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Active Client
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Clock className="h-3 w-3" /> Invited
          </span>
        )}
      </td>

      {/* Active Projects */}
      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-medium text-foreground tabular-nums">
        {client.activeProjectsCount} {client.activeProjectsCount === 1 ? "project" : "projects"}
      </td>

      {/* Total Contract Value */}
      <td className="px-4 py-3.5 whitespace-nowrap font-medium text-foreground tabular-nums">
        {client.totalContractValue > 0 ? formatCurrency(client.totalContractValue, client.currency || "USD") : "--"}
      </td>

      {/* Joined/Invited Date */}
      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
        {format(new Date(client.joinedDate), "MMM d, yyyy")}
      </td>

      {/* Action Link */}
      <td className="px-4 py-3.5 text-right whitespace-nowrap">
        {client.projectId ? (
          <Link
            href={`/projects/${client.projectId}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover transition-colors active:scale-[0.96] origin-center"
          >
            <span>Open project</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground font-medium">Pending project</span>
        )}
      </td>
    </tr>
  )
}
