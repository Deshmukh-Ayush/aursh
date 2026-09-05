"use client"

import { EChartsAreaChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-area-chart"

interface KpiSparklineProps {
  data: { day: number; value: number; [key: string]: unknown }[]
  config: ChartConfig
}

export function KpiSparkline({ data, config }: KpiSparklineProps) {
  return (
    <EChartsAreaChart
      data={data}
      className="h-full w-full"
      config={config}
    >
      <EChartsAreaChart.Area dataKey="value" />
    </EChartsAreaChart>
  )
}
