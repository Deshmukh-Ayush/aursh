"use client"

import { EChartsAreaChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-area-chart"
import { ConcentricCard } from "@/components/dashboard/shared/concentric-card"
import { MonospaceMetricStat } from "@/components/dashboard/shared/monospace-metric-stat"
import { TrendUpIcon } from "@phosphor-icons/react"

export interface MonthlyVelocityPoint {
  month: string
  revenue: number
  pipeline: number
  [key: string]: unknown
}

interface AnalyticsHeroChartUIProps {
  velocityData: MonthlyVelocityPoint[]
  peakMonthLabel: string
  peakMonthRevenue: number
  monthlyAvgRevenue: number
}

export function AnalyticsHeroChartUI({
  velocityData,
  peakMonthLabel,
  peakMonthRevenue,
  monthlyAvgRevenue,
}: AnalyticsHeroChartUIProps) {
  const chartConfig = {
    revenue: {
      label: "Won Revenue (₹)",
      colors: { light: ["#10B981"], dark: ["#10B981"] },
    },
    pipeline: {
      label: "Active Pipeline (₹)",
      colors: { light: ["#00AAF7"], dark: ["#00AAF7"] },
    },
  } satisfies ChartConfig

  return (
    <ConcentricCard
      headerExtra={
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <TrendUpIcon className="h-4 w-4 text-emerald-500" /> Revenue & Pipeline Execution Velocity (6 Months)
        </span>
      }
    >
      {/* Header Metric Stats */}
      <div className="flex flex-col gap-4 pb-4 border-b border-border/20 sm:flex-row sm:items-baseline justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[32px] leading-none font-bold tracking-tight text-foreground tabular-nums">
              ₹{(peakMonthRevenue * 2.4).toLocaleString("en-IN")}
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              6-Month Velocity
            </span>
          </div>
          <span className="mt-1 block text-xs font-medium text-pretty text-muted-foreground">
            Comparative analysis of converted revenue vs active proposals in flight
          </span>
        </div>

        <div className="flex items-center gap-6 shrink-0 text-right sm:text-right">
          <MonospaceMetricStat
            tag="[⬆] Peak Month"
            value={peakMonthLabel}
            subtext={`(₹${peakMonthRevenue.toLocaleString("en-IN")})`}
          />
          <MonospaceMetricStat
            tag="[~] Monthly Avg"
            value={`₹${monthlyAvgRevenue.toLocaleString("en-IN")}`}
            subtext="won/month"
          />
        </div>
      </div>

      {/* ECharts Area Chart */}
      <div className="h-[280px] w-full min-h-[280px] min-w-0">
        <EChartsAreaChart
          data={velocityData}
          config={chartConfig}
          className="h-full w-full min-h-[280px] min-w-0"
        >
          <EChartsAreaChart.Area dataKey="revenue" />
          <EChartsAreaChart.Area dataKey="pipeline" />
          <EChartsAreaChart.XAxis dataKey="month" />
          <EChartsAreaChart.YAxis />
          <EChartsAreaChart.Tooltip />
        </EChartsAreaChart>
      </div>
    </ConcentricCard>
  )
}
