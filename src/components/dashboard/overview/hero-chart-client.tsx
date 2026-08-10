"use client"

import { EChartsAreaChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-area-chart"
import { LightningIcon, TrendUpIcon } from "@phosphor-icons/react"

interface DashboardHeroChartUIProps {
  chartData: { day: string; activity: number }[]
  totalEvents: number
  topDayLabel: string
  topDayCount: number
  avgDaily: number
}

export function DashboardHeroChartUI({
  chartData,
  totalEvents,
  topDayLabel,
  topDayCount,
  avgDaily,
}: DashboardHeroChartUIProps) {
  const chartConfig = {
    activity: {
      label: "Workspace Activity",
      colors: { light: ["#10B981"], dark: ["#10B981"] },
    },
  } satisfies ChartConfig

  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground py-0.5 px-1 uppercase tracking-wide">
        <LightningIcon className="h-4 w-4 text-emerald-500" /> Workspace Momentum & Execution Velocity
      </span>
      <div className="rounded-md bg-white p-5 dark:bg-neutral-950 flex flex-col gap-4">
        {/* Monospace Metric Stats Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-border/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[22px] font-bold tracking-tight text-foreground tabular-nums leading-none">
                {totalEvents} Total Events
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendUpIcon className="w-3 h-3" /> Last 7 Days
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-medium text-pretty mt-1 block">
              Execution velocity recorded over the last 7 days
            </span>
          </div>

          <div className="flex items-center gap-6 shrink-0 text-right sm:text-right">
            <div>
              <span className="text-[11px] text-muted-foreground font-mono block uppercase">{"[⬆] Peak Day"}</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {topDayLabel} <span className="text-xs text-muted-foreground font-normal">({topDayCount})</span>
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-mono block uppercase">{"[~] Daily Avg"}</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {avgDaily} <span className="text-xs text-muted-foreground font-normal">/ day</span>
              </span>
            </div>
          </div>
        </div>

        {/* ECharts Area Chart */}
        <div className="h-[240px] w-full min-h-[240px] min-w-0">
          <EChartsAreaChart
            data={chartData}
            config={chartConfig}
            className="h-full w-full min-h-[240px] min-w-0"
          >
            <EChartsAreaChart.Area dataKey="activity" />
            <EChartsAreaChart.XAxis dataKey="day" />
            <EChartsAreaChart.YAxis />
            <EChartsAreaChart.Tooltip />
          </EChartsAreaChart>
        </div>
      </div>
    </div>
  )
}
