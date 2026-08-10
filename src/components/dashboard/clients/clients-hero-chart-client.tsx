"use client"

import { EChartsBarChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-bar-chart"
import { Users, TrendingUp } from "lucide-react"

export interface MonthlyClientConversionPoint extends Record<string, unknown> {
  month: string
  sent: number
  closed: number
}

interface ClientsHeroChartUIProps {
  chartData: MonthlyClientConversionPoint[]
  totalSent: number
  totalClosed: number
  conversionRate: number
}

export function ClientsHeroChartUI({
  chartData,
  totalSent,
  totalClosed,
  conversionRate,
}: ClientsHeroChartUIProps) {
  const chartConfig = {
    sent: {
      label: "Proposals Sent",
      colors: { light: ["#00AAF7"], dark: ["#00AAF7"] },
    },
    closed: {
      label: "Clients Closed",
      colors: { light: ["#10B981"], dark: ["#10B981"] },
    },
  } satisfies ChartConfig

  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground py-0.5 px-1 uppercase tracking-wide">
        <Users className="h-4 w-4 text-brand" /> Client Conversion Velocity (Proposals Sent vs Contracts Executed)
      </span>
      <div className="rounded-md bg-white p-5 dark:bg-neutral-950 flex flex-col gap-4">
        {/* Monospace Metric Stats Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-border/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[22px] font-bold tracking-tight text-foreground tabular-nums leading-none">
                {totalClosed} Clients Closed
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Trailing 6 Months
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-medium text-pretty mt-1 block">
              Comparison of proposals issued vs accepted client contracts
            </span>
          </div>

          <div className="flex items-center gap-6 shrink-0 text-right sm:text-right">
            <div>
              <span className="text-[11px] text-muted-foreground font-mono block uppercase">{"[⬆] Conversion Rate"}</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {conversionRate}% <span className="text-xs text-muted-foreground font-normal">({totalClosed}/{totalSent})</span>
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-mono block uppercase">{"[★] Proposals Issued"}</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {totalSent} <span className="text-xs text-muted-foreground font-normal">total</span>
              </span>
            </div>
          </div>
        </div>

        {/* ECharts Bar Chart */}
        <div className="h-[250px] w-full min-h-[250px] min-w-0">
          <EChartsBarChart
            data={chartData}
            config={chartConfig}
            className="h-full w-full min-h-[250px] min-w-0"
          >
            <EChartsBarChart.Bar dataKey="sent" />
            <EChartsBarChart.Bar dataKey="closed" />
            <EChartsBarChart.XAxis dataKey="month" />
            <EChartsBarChart.YAxis />
            <EChartsBarChart.Tooltip />
          </EChartsBarChart>
        </div>
      </div>
    </div>
  )
}
