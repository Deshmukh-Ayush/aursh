"use client"

import { OrgMembersManager } from "@/components/dashboard/org-members-manager"

interface TabTeamProps {
  org: {
    id: string
    plan: string
  }
  orgMembers: {
    id: string
    role: string
    user: {
      id: string
      name: string | null
      email: string
      image: string | null
    }
  }[]
}

export function TabTeam({ org, orgMembers }: TabTeamProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Team Management
        </h2>
        <p className="text-xs text-muted-foreground">
          Invite agency teammates to collaborate on client projects and contracts.
        </p>
      </div>

      <OrgMembersManager org={org} initialMembers={orgMembers} />
    </div>
  )
}
