"use client"

import { OrgSettingsForm } from "@/components/dashboard/org-settings-form"

interface TabBrandingProps {
  org: {
    id: string
    name: string
    logoUrl: string | null
    plan: string
  }
}

export function TabBranding({ org }: TabBrandingProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          White-Label Branding
        </h2>
        <p className="text-xs text-muted-foreground">
          Configure your agency logo and custom white-label branding for client portals and contracts.
        </p>
      </div>

      <OrgSettingsForm org={org} />
    </div>
  )
}
