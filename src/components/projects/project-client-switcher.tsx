"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FolderKanban, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface ClientProjectItem {
  id: string
  name: string
}

interface ProjectClientSwitcherProps {
  currentProjectId: string
  currentProjectName: string
  clientProjects: ClientProjectItem[]
}

export function ProjectClientSwitcher({
  currentProjectId,
  currentProjectName,
  clientProjects,
}: ProjectClientSwitcherProps) {
  const router = useRouter()

  if (clientProjects.length <= 1) {
    return (
      <span className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
        <FolderKanban className="h-4 w-4 text-brand" />
        {currentProjectName}
      </span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted/50 active:scale-[0.96]">
          <FolderKanban className="h-3.5 w-3.5 text-brand" />
          <span className="truncate max-w-[140px]">{currentProjectName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase text-muted-foreground">
          My Projects
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {clientProjects.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => router.push(`/projects/${p.id}`)}
            className="flex items-center justify-between cursor-pointer text-xs"
          >
            <span className={p.id === currentProjectId ? "font-bold text-brand" : ""}>
              {p.name}
            </span>
            {p.id === currentProjectId && (
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
