"use client"

import { User, Users, Palette, CreditCard, Bell } from "lucide-react"
import { SlidingPillTabs } from "@/components/dashboard/shared/sliding-pill-tabs"

export type SettingsTab = "general" | "team" | "branding" | "billing" | "notifications"

interface SettingsTabBarProps {
  activeTab: SettingsTab
  setActiveTab: (tab: SettingsTab) => void
}

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: User },
  { id: "team", label: "Team", icon: Users },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
]

export function SettingsTabBar({ activeTab, setActiveTab }: SettingsTabBarProps) {
  return (
    <SlidingPillTabs
      layoutId="activeSettingsTabPill"
      tabs={tabs}
      activeTab={activeTab}
      onChange={setActiveTab}
    />
  )
}
