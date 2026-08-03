"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, subDays, parseISO } from "date-fns";
import type { OverviewActivity } from "./project-overview-types";
import { ProjectOverviewCard } from "./project-overview-card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type ProjectOverviewMomentumChartProps = {
  recentActivity: OverviewActivity[];
};

const chartConfig = {
  activity: {
    label: "Activities",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function ProjectOverviewMomentumChart({
  recentActivity,
}: ProjectOverviewMomentumChartProps) {
  // `js-combine-iterations`: single pass to build 14-day history
  const data = useMemo(() => {
    const today = new Date();
    const map = new Map<string, number>();

    // Initialize 14 days with 0
    for (let i = 13; i >= 0; i--) {
      const d = subDays(today, i);
      const key = format(d, "MMM dd");
      map.set(key, 0);
    }

    // Count activities
    for (const a of recentActivity) {
      const d = new Date(a.log.createdAt);
      const key = format(d, "MMM dd");
      if (map.has(key)) {
        map.set(key, (map.get(key) || 0) + 1);
      }
    }

    return Array.from(map.entries()).map(([date, activity]) => ({
      date,
      activity,
    }));
  }, [recentActivity]);

  return (
    <ProjectOverviewCard padding="md" className="flex flex-col">
      <div className="mb-4">
        <h2 className="text-[14px] font-semibold tracking-tight text-foreground">
          Project Momentum
        </h2>
        <p className="text-[12px] text-muted-foreground">Activity over the last 14 days</p>
      </div>

      <div className="flex-1 mt-6">
        <ChartContainer config={chartConfig} className="min-h-[200px] h-[200px] w-full">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -24,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="fillActivity" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-activity)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-activity)"
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" className="tabular-nums" />}
            />
            <Area
              dataKey="activity"
              type="monotone"
              fill="url(#fillActivity)"
              fillOpacity={1}
              stroke="var(--color-activity)"
              strokeWidth={2}
              activeDot={{ r: 4, strokeWidth: 1, stroke: "hsl(var(--background))" }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </ProjectOverviewCard>
  );
}
