"use client"

import { EChartsAreaChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-area-chart"
import { TrendingUp, Sparkles } from "lucide-react"

export interface MonthlyVelocityPoint extends Record<string, unknown> {
  month: string
  revenue: number
  pipeline: number
}

interface AnalyticsHeroChartUIProps {
  chartData: MonthlyVelocityPoint[]
  totalWon: number
  peakMonthLabel: string
  peakMonthValue: number
  monthlyAvg: number
}

export function AnalyticsHeroChartUI({
  chartData,
  totalWon,
  peakMonthLabel,
  peakMonthValue,
  monthlyAvg,
}: AnalyticsHeroChartUIProps) {
  const chartConfig = {
    revenue: {
      label: "Won Revenue",
      colors: { light: ["#10B981"], dark: ["#10B981"] },
    },
    pipeline: {
      label: "Active Pipeline",
      colors: { light: ["#00AAF7"], dark: ["#00AAF7"] },
    },
  } satisfies ChartConfig

  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground py-0.5 px-1 uppercase tracking-wide">
        <Sparkles className="h-4 w-4 text-brand" /> Revenue & Pipeline Velocity (6-Month Trend)
      </span>
      <div className="rounded-md bg-white p-5 dark:bg-neutral-950 flex flex-col gap-4">
        {/* Monospace Metric Stats Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-border/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[22px] font-bold tracking-tight text-foreground tabular-nums leading-none">
                ₹{totalWon.toLocaleString("en-IN")} Total Won
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Trailing 6 Months
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-medium text-pretty mt-1 block">
              Comparison of accepted proposal revenue vs active pipeline velocity
            </span>
          </div>

          <div className="flex items-center gap-6 shrink-0 text-right sm:text-right">
            <div>
              <span className="text-[11px] text-muted-foreground font-mono block uppercase">{"[⬆] Peak Month"}</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {peakMonthLabel} <span className="text-xs text-muted-foreground font-normal">(₹{peakMonthValue.toLocaleString("en-IN")})</span>
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-mono block uppercase">{"[~] Monthly Avg"}</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                ₹{monthlyAvg.toLocaleString("en-IN")} <span className="text-xs text-muted-foreground font-normal">/ mo</span>
              </span>
            </div>
          </div>
        </div>

        {/* ECharts Area Chart */}
        <div className="h-[250px] w-full min-h-[250px] min-w-0">
          <EChartsAreaChart
            data={chartData}
            config={chartConfig}
            className="h-full w-full min-h-[250px] min-w-0"
          >
            <EChartsAreaChart.Area dataKey="revenue" />
            <EChartsAreaChart.Area dataKey="pipeline" />
            <EChartsAreaChart.XAxis dataKey="month" />
            <EChartsAreaChart.YAxis />
            <EChartsAreaChart.Tooltip />
          </EChartsAreaChart>
        </div>
      </div>
    </div>
  )
}
