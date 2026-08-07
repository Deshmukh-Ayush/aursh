"use client"

import {
  EChartsRadialChart,
  type ChartConfig,
} from "@/components/evilcharts/charts/echarts-radial-chart"
import { cn } from "@/lib/utils"
import type { MilestoneWithDetails } from "@/store/types"
import { ChartPieSliceIcon } from "@phosphor-icons/react"

type PaymentsRadialChartProps = {
  milestones: MilestoneWithDetails[]
  formatMoney: (amountInUnits: number, curr?: string) => string
}

export function PaymentsRadialChart({
  milestones,
  formatMoney,
}: PaymentsRadialChartProps) {
  const totalProjectValue = milestones.reduce((sum, m) => sum + m.amount, 0)

  const collectedAmount = milestones
    .filter((m) => m.status === "paid")
    .reduce((sum, m) => sum + m.amount, 0)

  const dueAmount = milestones
    .filter((m) => m.status === "due")
    .reduce((sum, m) => sum + m.amount, 0)

  const overdueAmount = milestones
    .filter(
      (m) =>
        m.status === "overdue" ||
        (m.status === "due" && m.dueDate && new Date(m.dueDate) < new Date())
    )
    .reduce((sum, m) => sum + m.amount, 0)

  const upcomingAmount = milestones
    .filter((m) => m.status === "upcoming")
    .reduce((sum, m) => sum + m.amount, 0)

  const calcPercent: (amt: number) => number = (amt) => {
    if (totalProjectValue <= 0) return 0
    return Math.round((amt / totalProjectValue) * 100)
  }

  const chartData = [
    {
      name: "collected",
      label: "Collected",
      value: calcPercent(collectedAmount),
      amount: collectedAmount,
      swatch: "bg-emerald-500 dark:bg-emerald-400",
    },
    {
      name: "due",
      label: "Payment Due",
      value: calcPercent(dueAmount),
      amount: dueAmount,
      swatch: "bg-sky-500 dark:bg-sky-400",
    },
    {
      name: "overdue",
      label: "Overdue",
      value: calcPercent(overdueAmount),
      amount: overdueAmount,
      swatch: "bg-red-500 dark:bg-red-400",
    },
    {
      name: "upcoming",
      label: "Upcoming",
      value: calcPercent(upcomingAmount),
      amount: upcomingAmount,
      swatch: "bg-purple-600 dark:bg-purple-600",
    },
  ]

  const chartConfig = {
    collected: {
      label: "Collected",
      colors: {
        light: ["#10b981"], // emerald-500
        dark: ["#34d399"], // emerald-400
      },
    },
    due: {
      label: "Payment Due",
      colors: {
        light: ["#0ea5e9"], // sky-500
        dark: ["#38bdf8"], // sky-400
      },
    },
    overdue: {
      label: "Overdue",
      colors: {
        light: ["#ef4444"], // red-500
        dark: ["#f87171"], // red-400
      },
    },
    upcoming: {
      label: "Upcoming",
      colors: {
        light: ["#9333ea"], // violet-500
        dark: ["#9333ea"], // violet-400
      },
    },
  } satisfies ChartConfig
  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <span className="flex items-center gap-1 text-[12px] font-medium dark:text-neutral-400 py-0.5">
        <ChartPieSliceIcon className="h-5 w-5" /> Financial Portfolio Breakdown
      </span>
      <div className="rounded-md bg-white p-4 dark:bg-neutral-950">
        {/* Header Section */}
        <div className="flex items-baseline justify-between gap-4 pb-6">
          <span className="text-[18px] font-semibold dark:text-neutral-300">
            Total Scheduled
          </span>
          <span className="text-[18px] font-semibold tabular-nums dark:text-neutral-200">
            {formatMoney(totalProjectValue)}
          </span>
        </div>

        <div className="flex flex-col gap-6">
          {/* Radial Charts (Removed background cards/borders) */}
          <div className="flex items-center justify-between gap-2 px-2 md:px-8">
            {chartData.map((row) => (
              <div key={row.name} className="flex flex-col items-center gap-2">
                <div className="aspect-square w-full max-w-16">
                  <EChartsRadialChart
                    data={[row]}
                    config={chartConfig}
                    nameKey="name"
                    max={100}
                    innerRadius="70%"
                    outerRadius="100%"
                    className="h-full w-full"
                  >
                    <EChartsRadialChart.RadialBar
                      dataKey="value"
                      barSize={8}
                      cornerRadius={6}
                    />
                  </EChartsRadialChart>
                </div>
                <span className="w-full truncate text-center text-xs font-medium text-muted-foreground">
                  {row.label}
                </span>
              </div>
            ))}
          </div>

          {/* List View (Converted from grid chips) */}
          <div className="flex flex-col gap-1">
            {chartData.map(({ name, label, value, amount, swatch }, index) => (
              <div
                key={name}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
                  index % 2 === 0
                    ? "bg-muted/20 hover:bg-muted/40"
                    : "hover:bg-muted/20"
                )}
              >
                <span className={cn("size-3 shrink-0 rounded-xs", swatch)} />

                <span className="min-w-[3ch] text-sm font-bold text-foreground tabular-nums">
                  {value}%
                </span>

                <span className="text-sm font-medium text-muted-foreground">
                  {label}
                </span>

                <span className="ml-auto text-sm font-semibold text-foreground tabular-nums">
                  {formatMoney(amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
