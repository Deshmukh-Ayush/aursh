"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { ProjectTableItem } from "./projects-table-types"
import { ProjectsStatusBadge } from "./projects-status-badge"
import { ProjectsProgressBar } from "./projects-progress-bar"

interface ProjectsTableRowProps {
  project: ProjectTableItem
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`
}

export function ProjectsTableRow({ project }: ProjectsTableRowProps) {
  return (
    <tr className="group transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40">
      {/* Project Info */}
      <td className="px-5 py-3.5">
        <div className="flex flex-col min-w-0">
          <Link
            href={`/projects/${project.id}`}
            className="font-semibold text-foreground hover:underline truncate text-sm"
          >
            {project.name}
          </Link>
          {project.description ? (
            <span className="text-xs text-muted-foreground truncate max-w-xs">
              {project.description}
            </span>
          ) : null}
        </div>
      </td>

      {/* Status Badge */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <ProjectsStatusBadge status={project.status} />
      </td>

      {/* Financial Value */}
      <td className="px-4 py-3.5 whitespace-nowrap font-medium text-foreground tabular-nums">
        {project.contractValue ? formatCurrency(project.contractValue) : "--"}
      </td>

      {/* Deliverables Progress */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <ProjectsProgressBar
          total={project.deliverableStats.total}
          approved={project.deliverableStats.approved}
        />
      </td>

      {/* Team Avatars */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex -space-x-1.5 overflow-hidden">
          {project.members.slice(0, 3).map((m) => (
            <div
              key={m.id}
              className="relative h-6 w-6 rounded-full border-2 border-background bg-muted overflow-hidden"
              title={m.name || m.email}
            >
              {m.image ? (
                <Image src={m.image} alt={m.name || "User"} fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-primary">
                  {(m.name || m.email).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))}
          {project.members.length > 3 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-medium text-muted-foreground">
              +{project.members.length - 3}
            </div>
          )}
        </div>
      </td>

      {/* Date Updated */}
      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
        {format(new Date(project.updatedAt), "MMM d, yyyy")}
      </td>

      {/* Action Link */}
      <td className="px-4 py-3.5 text-right whitespace-nowrap">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary transition-colors active:scale-[0.96] origin-center"
        >
          <span>Open project</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </td>
    </tr>
  )
}
