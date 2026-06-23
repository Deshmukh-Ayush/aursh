"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "An interactive bar chart showing team activity"

const chartConfig = {
  actions: {
    label: "Actions",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function ActivityChart({ data }: { data: { date: string; actions: number }[] }) {
  const total = React.useMemo(
    () => data.reduce((acc, curr) => acc + curr.actions, 0),
    [data]
  )

  return (
    <Card className="shadow-[0_2px_10px_rgba(0,0,0,0.04)] border-border/40">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Team Activity Volume</CardTitle>
          <CardDescription>
            Total actions across all projects for the last 14 days
          </CardDescription>
        </div>
        <div className="flex">
          <div className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-l sm:border-t-0 sm:px-8 sm:py-6">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Actions
            </span>
            <span className="text-lg font-bold leading-none sm:text-3xl tabular-nums">
              {total.toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="actions"
                />
              }
            />
            <Bar dataKey="actions" fill="var(--color-actions)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
