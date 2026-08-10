"use client"

import { CurrencyInrIcon, FolderIcon } from "@phosphor-icons/react"
import { EChartsAreaChart } from "@/components/evilcharts/charts/echarts-area-chart"

interface DashboardKpiRowUIProps {
  totalIncome: number
  activeProjectsCount: number
  trendData1: { day: number; value: number }[]
  trendData2: { day: number; value: number }[]
}

export function DashboardKpiRowUI({
  totalIncome,
  activeProjectsCount,
  trendData1,
  trendData2,
}: DashboardKpiRowUIProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* KPI 1: Total Income */}
      <div className="flex flex-col h-full rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
        <div className="flex h-full flex-col justify-between space-y-4 rounded-md bg-white p-5 dark:bg-neutral-950">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <CurrencyInrIcon className="h-4 w-4 text-emerald-500" /> Total Income
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400 tabular-nums">
              From signed contracts
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[32px] leading-none font-semibold tracking-tight text-foreground tabular-nums">
                ₹{totalIncome.toLocaleString("en-IN")}
              </div>
              <p className="text-xs leading-relaxed text-pretty text-muted-foreground">
                Accepted proposals value
              </p>
            </div>

            <div className="h-12 w-24 shrink-0">
              <EChartsAreaChart
                data={trendData1}
                xAxisKey="day"
                className="h-full w-full"
                showAxis={false}
                showGrid={false}
                showTooltip={false}
                config={{
                  value: { label: "Value", color: "#10B981" }
                }}
              >
                <EChartsAreaChart.Area
                  dataKey="value"
                  strokeWidth={2}
                  fillOpacity={0.15}
                />
              </EChartsAreaChart>
            </div>
          </div>
        </div>
      </div>

      {/* KPI 2: Active Projects */}
      <div className="flex flex-col h-full rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
        <div className="flex h-full flex-col justify-between space-y-4 rounded-md bg-white p-5 dark:bg-neutral-950">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <FolderIcon className="h-4 w-4 text-sky-500" /> Active Projects
            </span>
            <span className="rounded-full bg-sky-500/10 px-2 py-1 text-xs font-semibold tracking-wider text-sky-600 uppercase dark:text-sky-400 tabular-nums">
              Current workspace
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[32px] leading-none font-semibold tracking-tight text-foreground tabular-nums">
                {activeProjectsCount}
              </div>
              <p className="text-xs leading-relaxed text-pretty text-muted-foreground">
                Currently in progress
              </p>
            </div>

            <div className="h-12 w-24 shrink-0">
              <EChartsAreaChart
                data={trendData2}
                xAxisKey="day"
                className="h-full w-full"
                showAxis={false}
                showGrid={false}
                showTooltip={false}
                config={{
                  value: { label: "Projects", color: "#0284C7" }
                }}
              >
                <EChartsAreaChart.Area
                  dataKey="value"
                  strokeWidth={2}
                  fillOpacity={0.15}
                />
              </EChartsAreaChart>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
