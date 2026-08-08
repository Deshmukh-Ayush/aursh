"use client";

import { useMemo } from "react";
import { format, subDays, isSameDay } from "date-fns";
import type { OverviewActivity } from "./project-overview-types";
import { EChartsAreaChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-area-chart";
import { TrendUpIcon, LightningIcon } from "@phosphor-icons/react";

type ProjectOverviewMomentumChartProps = {
  recentActivity: OverviewActivity[];
};

export function ProjectOverviewMomentumChart({
  recentActivity,
}: ProjectOverviewMomentumChartProps) {
  const { chartData, totalActions, topDay, avgDaily } = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 14 }, (_, i) => subDays(today, 13 - i));

    let maxActions = 0;
    let maxDayLabel = "Today";

    const data = days.map((d) => {
      const dayLabel = format(d, "MMM d");
      const count = recentActivity.filter((a) => isSameDay(new Date(a.log.createdAt), d)).length;
      if (count > maxActions) {
        maxActions = count;
        maxDayLabel = dayLabel;
      }
      return {
        day: dayLabel,
        activity: count,
      };
    });

    const total = recentActivity.length;
    const avg = parseFloat((total / 14).toFixed(1));

    return {
      chartData: data,
      totalActions: total,
      topDay: { label: maxDayLabel, count: maxActions },
      avgDaily: avg,
    };
  }, [recentActivity]);

  const chartConfig = {
    activity: {
      label: "Project Audit Actions",
      colors: { light: ["#00AAF7"], dark: ["#00AAF7"] },
    },
  } satisfies ChartConfig;

  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <span className="flex items-center gap-1.5 text-[12px] font-medium dark:text-neutral-400 py-0.5 px-1">
        <LightningIcon className="h-4 w-4 text-brand" /> Project Momentum & Execution Velocity
      </span>
      <div className="rounded-md bg-white p-5 dark:bg-neutral-950 flex flex-col gap-4">
        {/* Monospace Metric Stats Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-border/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[22px] font-bold tracking-tight text-foreground tabular-nums leading-none">
                {totalActions} Total Events
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendUpIcon className="w-3 h-3" /> Active
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-medium text-pretty mt-1 block">
              Execution velocity recorded over the last 14 days
            </span>
          </div>

          <div className="flex items-center gap-6 shrink-0 text-right sm:text-right">
            <div>
              <span className="text-[11px] text-muted-foreground font-mono block uppercase">{"[⬆] Peak Day"}</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {topDay.label} <span className="text-xs text-muted-foreground font-normal">({topDay.count})</span>
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-mono block uppercase">{"[~] Daily Avg"}</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {avgDaily} <span className="text-xs text-muted-foreground font-normal">/ day</span>
              </span>
            </div>
          </div>
        </div>

        {/* EvilCharts Area Chart */}
        <div className="h-[200px] w-full min-h-[200px] min-w-0">
          <EChartsAreaChart
            data={chartData}
            config={chartConfig}
            className="h-full w-full min-h-[200px] min-w-0"
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
