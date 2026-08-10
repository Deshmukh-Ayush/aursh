"use client"

import { EChartsAreaChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-area-chart"
import { TrendUpIcon } from "@phosphor-icons/react"
import { ConcentricCard } from "@/components/dashboard/shared/concentric-card"
import { MonospaceMetricStat } from "@/components/dashboard/shared/monospace-metric-stat"

interface DashboardHeroChartUIProps {
  chartData: { day: string; activity: number; [key: string]: unknown }[]
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
      label: "Activities",
      colors: { light: ["#10B981"], dark: ["#10B981"] },
    },
  } satisfies ChartConfig

  return (
    <ConcentricCard
      headerExtra={
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <TrendUpIcon className="h-4 w-4 text-emerald-500" /> Execution Velocity (Last 7 Days)
        </span>
      }
    >
      {/* Header Metric Stats */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-border/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[32px] leading-none font-bold tracking-tight text-foreground tabular-nums">
              {totalEvents} Actions
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Active Pace
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-medium text-pretty mt-1 block">
            Workspace events across contracts, proposals, and deliverables
          </span>
        </div>

        <div className="flex items-center gap-6 shrink-0 text-right sm:text-right">
          <MonospaceMetricStat
            tag="[⬆] Peak Day"
            value={topDayLabel}
            subtext={`(${topDayCount} actions)`}
          />
          <MonospaceMetricStat
            tag="[~] Daily Avg"
            value={avgDaily}
            subtext="actions/day"
          />
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
    </ConcentricCard>
  )
}
