"use client"

import { motion } from "framer-motion"
import { User, Users, Palette, CreditCard, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

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
    <div className="relative flex items-center gap-1 overflow-x-auto rounded-full border border-border/40 bg-muted/50 p-1 hide-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative z-10 flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors active:scale-[0.96]",
              isActive ? "text-white font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeSettingsTabPill"
                className="absolute inset-0 -z-10 rounded-full bg-brand shadow-xs"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
