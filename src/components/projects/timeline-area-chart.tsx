"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type DataPoint = {
  date: string;
  completed: number;
  expected: number;
};

export function TimelineAreaChart({ data }: { data: DataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-40 w-full flex-col items-center justify-center rounded-lg bg-muted/15 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
        <span className="text-[11px] font-medium text-muted-foreground">No data available</span>
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full">
      <ChartContainer
        config={{
          expected: {
            label: "Total Expected",
            color: "hsl(var(--muted-foreground))",
          },
          completed: {
            label: "Completed",
            color: "hsl(142 71% 45%)",
          },
        }}
        className="h-full w-full"
      >
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{
            left: -20,
            right: 4,
            top: 4,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-completed)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--color-completed)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fillExpected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-expected)" stopOpacity={0.08} />
              <stop offset="95%" stopColor="var(--color-expected)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/30" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={30}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            allowDecimals={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Area
            dataKey="expected"
            type="monotone"
            fill="url(#fillExpected)"
            fillOpacity={1}
            stroke="var(--color-expected)"
            strokeOpacity={0.4}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            isAnimationActive={true}
            animationDuration={800}
          />
          <Area
            dataKey="completed"
            type="monotone"
            fill="url(#fillCompleted)"
            fillOpacity={1}
            stroke="var(--color-completed)"
            strokeWidth={2}
            isAnimationActive={true}
            animationDuration={800}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
