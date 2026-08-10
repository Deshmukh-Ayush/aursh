"use client"

import * as React from "react"
import { Bell, Mail, FileText, CheckCircle2 } from "lucide-react"
import { ConcentricCard } from "@/components/dashboard/shared/concentric-card"

export function TabNotifications() {
  const [contractSigned, setContractSigned] = React.useState(true)
  const [deliverableUpdates, setDeliverableUpdates] = React.useState(true)
  const [weeklyDigest, setWeeklyDigest] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex flex-col gap-6">
      <ConcentricCard
        label="Email Notification Preferences"
        icon={Bell}
        innerClassName="p-6 gap-6"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Toggle 1: Contract Signed */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-foreground">Contract Sign-Off Notifications</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send email notifications when a client signs a contract or accepts a proposal.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setContractSigned(!contractSigned)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                contractSigned ? "bg-brand" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  contractSigned ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="h-px w-full bg-border/20" />

          {/* Toggle 2: Deliverables & Revisions */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-foreground">Deliverable Status & Revision Alerts</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send email notifications when deliverables are approved or revisions are requested by clients.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDeliverableUpdates(!deliverableUpdates)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                deliverableUpdates ? "bg-brand" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  deliverableUpdates ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="h-px w-full bg-border/20" />

          {/* Toggle 3: Weekly Digest */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-foreground">Weekly Performance Digest</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send weekly performance summary emails with won revenue, conversion rates, and pipeline health.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWeeklyDigest(!weeklyDigest)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                weeklyDigest ? "bg-brand" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  weeklyDigest ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t border-border/20">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-transform hover:bg-brand-hover active:scale-[0.96]"
            >
              {saved ? "Saved preferences!" : "Save preferences"}
            </button>
          </div>
        </form>
      </ConcentricCard>
    </div>
  )
}
