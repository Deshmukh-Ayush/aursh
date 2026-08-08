"use client";

import { useMemo } from "react";
import { format, subDays, isSameDay } from "date-fns";
import type { OverviewActivity } from "./project-overview-types";
import { EChartsAreaChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-area-chart";
import { Activity } from "lucide-react";

type ProjectOverviewMomentumChartProps = {
  recentActivity: OverviewActivity[];
};

export function ProjectOverviewMomentumChart({
  recentActivity,
}: ProjectOverviewMomentumChartProps) {
  const chartData = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 14 }, (_, i) => subDays(today, 13 - i));

    return days.map((d) => {
      const dayLabel = format(d, "MMM d");
      const count = recentActivity.filter((a) => isSameDay(new Date(a.log.createdAt), d)).length;
      return {
        day: dayLabel,
        activity: count,
      };
    });
  }, [recentActivity]);

  const chartConfig = {
    activity: {
      label: "Project Activity Events",
      colors: { light: ["#00AAF7"], dark: ["#00AAF7"] },
    },
  } satisfies ChartConfig;

  const totalActions = recentActivity.length;

  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <span className="flex items-center gap-1 text-[12px] font-medium dark:text-neutral-400 py-0.5">
        <Activity className="h-4 w-4 text-[#00AAF7]" /> Project Momentum & Execution Activity
      </span>
      <div className="rounded-md bg-white p-4 dark:bg-neutral-950">
        {/* Header Section */}
        <div className="flex items-baseline justify-between gap-4 pb-4 border-b border-border/20 mb-4">
          <div>
            <span className="text-[18px] font-semibold block dark:text-neutral-300">
              Activity Velocity
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Actions logged over the last 14 days
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground font-medium block">Total Recorded</span>
            <span className="text-[18px] font-semibold tabular-nums dark:text-neutral-200">
              {totalActions} Events
            </span>
          </div>
        </div>

        {/* EvilCharts Area Chart */}
        <div className="h-[180px] w-full">
          <EChartsAreaChart
            data={chartData}
            config={chartConfig}
            className="h-full w-full"
          >
            <EChartsAreaChart.Area dataKey="activity" />
            <EChartsAreaChart.XAxis dataKey="day" />
            <EChartsAreaChart.Tooltip />
          </EChartsAreaChart>
        </div>
      </div>
    </div>
  );
}
