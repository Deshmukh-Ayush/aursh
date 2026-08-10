"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor, ShieldCheck, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConcentricCard } from "@/components/dashboard/shared/concentric-card"

interface TabGeneralProps {
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export function TabGeneral({ user }: TabGeneralProps) {
  const { theme, setTheme } = useTheme()
  const [name, setName] = React.useState(user.name || "")
  const [saved, setSaved] = React.useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Info */}
      <ConcentricCard
        label="User Profile"
        icon={User}
        innerClassName="p-6 gap-5"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="text-xs font-medium text-foreground">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ayush Deshmukh"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-foreground">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="h-9 rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              Email address is managed by your account provider.
            </span>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-transform hover:bg-brand-hover active:scale-[0.96]"
            >
              {saved ? "Saved!" : "Save changes"}
            </button>
          </div>
        </form>
      </ConcentricCard>

      {/* Theme Preference */}
      <ConcentricCard innerClassName="p-6 gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Interface Theme
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select your preferred appearance mode for Scrunity.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-xs font-medium transition-all active:scale-[0.96]",
              theme === "light"
                ? "border-brand bg-brand/5 text-brand shadow-xs"
                : "border-border/60 hover:bg-muted/40 text-muted-foreground"
            )}
          >
            <Sun className="h-5 w-5" />
            <span>Light</span>
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-xs font-medium transition-all active:scale-[0.96]",
              theme === "dark"
                ? "border-brand bg-brand/5 text-brand shadow-xs"
                : "border-border/60 hover:bg-muted/40 text-muted-foreground"
            )}
          >
            <Moon className="h-5 w-5" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => setTheme("system")}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-xs font-medium transition-all active:scale-[0.96]",
              theme === "system"
                ? "border-brand bg-brand/5 text-brand shadow-xs"
                : "border-border/60 hover:bg-muted/40 text-muted-foreground"
            )}
          >
            <Monitor className="h-5 w-5" />
            <span>System</span>
          </button>
        </div>
      </ConcentricCard>

      {/* Account Security */}
      <ConcentricCard innerClassName="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Google OAuth Active</h3>
            <p className="text-xs text-muted-foreground">
              Your account is authenticated securely via Google OAuth.
            </p>
          </div>
        </div>
      </ConcentricCard>
    </div>
  )
}
