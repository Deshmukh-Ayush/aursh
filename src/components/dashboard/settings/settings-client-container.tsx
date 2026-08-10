"use client"

import * as React from "react"
import { SettingsTabBar, SettingsTab } from "./settings-tab-bar"
import { TabGeneral } from "./tab-general"
import { TabTeam } from "./tab-team"
import { TabBranding } from "./tab-branding"
import { TabBilling } from "./tab-billing"
import { TabNotifications } from "./tab-notifications"

interface SettingsClientContainerProps {
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  org: {
    id: string
    name: string
    logoUrl: string | null
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

export function SettingsClientContainer({
  user,
  org,
  orgMembers,
}: SettingsClientContainerProps) {
  const [activeTab, setActiveTab] = React.useState<SettingsTab>("general")

  return (
    <div className="flex flex-col gap-6">
      {/* Sliding Pill Tab Navigation Bar */}
      <SettingsTabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === "general" && <TabGeneral user={user} />}
        {activeTab === "team" && <TabTeam org={{ id: org.id, plan: org.plan }} orgMembers={orgMembers} />}
        {activeTab === "branding" && <TabBranding org={org} />}
        {activeTab === "billing" && <TabBilling orgId={org.id} currentPlan={org.plan} />}
        {activeTab === "notifications" && <TabNotifications />}
      </div>
    </div>
  )
}
