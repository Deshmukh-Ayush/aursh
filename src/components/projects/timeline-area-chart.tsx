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
      <div className="flex h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed border-muted bg-muted/20">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">No Timeline Data</span>
      </div>
    );
  }

  return (
    <div className="h-[250px] w-full mt-4">
      <ChartContainer
        config={{
          expected: {
            label: "Total Expected",
            color: "hsl(var(--muted-foreground) / 0.3)",
          },
          completed: {
            label: "Completed",
            color: "var(--primary)",
          },
        }}
        className="h-full w-full"
      >
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{
            left: -20,
            right: 10,
            top: 10,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-completed)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-completed)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fillExpected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-expected)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--color-expected)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={30}
            className="text-xs text-muted-foreground font-medium"
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            allowDecimals={false}
            className="text-xs text-muted-foreground font-medium"
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Area
            dataKey="expected"
            type="monotone"
            fill="url(#fillExpected)"
            fillOpacity={1}
            stroke="var(--color-expected)"
            strokeWidth={2}
            strokeDasharray="4 4"
            isAnimationActive={true}
          />
          <Area
            dataKey="completed"
            type="monotone"
            fill="url(#fillCompleted)"
            fillOpacity={1}
            stroke="var(--color-completed)"
            strokeWidth={2}
            isAnimationActive={true}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
