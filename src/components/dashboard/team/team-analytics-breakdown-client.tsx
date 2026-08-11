"use client"

import Image from "next/image"
import { Trophy, Activity, CheckCircle2, FileText, Send } from "lucide-react"
import { ConcentricCard } from "@/components/dashboard/shared/concentric-card"
import { formatDistanceToNow } from "date-fns"

export interface TopContributorItem {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  actionCount: number
}

export interface TeamActivityLogItem {
  id: string
  type: string
  message: string
  createdAt: string
  user: {
    name: string
    email: string
    image: string | null
  } | null
}

interface TeamAnalyticsBreakdownUIProps {
  topContributors: TopContributorItem[]
  recentActivities: TeamActivityLogItem[]
}

function getActivityIcon(type: string) {
  if (type.startsWith("contract")) {
    return <FileText className="h-3.5 w-3.5 text-emerald-500" />
  }
  if (type.startsWith("deliverable")) {
    return <CheckCircle2 className="h-3.5 w-3.5 text-sky-500" />
  }
  if (type.startsWith("proposal")) {
    return <Send className="h-3.5 w-3.5 text-brand" />
  }
  return <Activity className="h-3.5 w-3.5 text-amber-500" />
}

export function TeamAnalyticsBreakdownUI({
  topContributors,
  recentActivities,
}: TeamAnalyticsBreakdownUIProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Top Contributors Leaderboard */}
      <ConcentricCard
        headerExtra={
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              <Trophy className="h-4 w-4 text-amber-500" /> Top Contributors
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Activity Leaderboard
            </span>
          </div>
        }
        innerClassName="p-5 space-y-4"
      >
        <div className="space-y-3">
          {topContributors.map((c, index) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-border/30"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground tabular-nums">
                  #{index + 1}
                </span>
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border bg-muted">
                  {c.image ? (
                    <Image src={c.image} alt={c.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-brand bg-brand/10">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {c.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {c.role}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand tabular-nums">
                  {c.actionCount} {c.actionCount === 1 ? "action" : "actions"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ConcentricCard>

      {/* Recent Team Activity Stream */}
      <ConcentricCard
        headerExtra={
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
              <Activity className="h-4 w-4 text-brand" /> Live Team Activity Log
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Real-time Stream
            </span>
          </div>
        }
        innerClassName="p-5 space-y-4"
      >
        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No recent team activities logged.
            </div>
          ) : (
            recentActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-2.5 rounded-lg border border-border/30 bg-neutral-50/50 dark:bg-neutral-900/30"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  {getActivityIcon(act.type)}
                </div>
                <div className="flex flex-1 flex-col min-w-0">
                  <p className="text-xs text-foreground leading-snug">
                    <span className="font-semibold">{act.user?.name || "Team Member"}</span>{" "}
                    {act.message}
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                    {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </ConcentricCard>
    </div>
  )
}
