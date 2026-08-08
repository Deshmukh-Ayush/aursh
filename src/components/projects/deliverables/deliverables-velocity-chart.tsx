"use client";

import { EChartsAreaChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-area-chart";
import { cn } from "@/lib/utils";
import { PackageIcon } from "@phosphor-icons/react";
import type { DeliverableItem } from "./types";
import { format, subDays, isAfter } from "date-fns";

type DeliverablesVelocityChartProps = {
  deliverables: DeliverableItem[];
};

export function DeliverablesVelocityChart({ deliverables }: DeliverablesVelocityChartProps) {
  const totalCount = deliverables.length;

  const approvedCount = deliverables.filter((d) => d.status === "approved").length;
  const inReviewCount = deliverables.filter((d) => d.status === "in_review").length;
  const pendingCount = deliverables.filter((d) => d.status === "pending").length;
  const revisionCount = deliverables.filter((d) => d.status === "revision_requested").length;

  const calcPercent = (count: number) => {
    if (totalCount <= 0) return 0;
    return Math.round((count / totalCount) * 100);
  };

  const categories = [
    {
      name: "approved",
      label: "Approved",
      value: calcPercent(approvedCount),
      count: approvedCount,
      swatch: "bg-emerald-500 dark:bg-emerald-400",
    },
    {
      name: "in_review",
      label: "In Review",
      value: calcPercent(inReviewCount),
      count: inReviewCount,
      swatch: "bg-sky-500 dark:bg-sky-400",
    },
    {
      name: "pending",
      label: "Pending",
      value: calcPercent(pendingCount),
      count: pendingCount,
      swatch: "bg-purple-600 dark:bg-purple-600",
    },
    {
      name: "revision_requested",
      label: "Needs Revision",
      value: calcPercent(revisionCount),
      count: revisionCount,
      swatch: "bg-red-500 dark:bg-red-400",
    },
  ];

  const overallProgress = calcPercent(approvedCount);

  // Group deliverables by recent days/weeks for ECharts static Area Chart
  const today = new Date();
  const days = [28, 21, 14, 7, 0].map((daysAgo) => subDays(today, daysAgo));

  const chartData = days.map((date) => {
    const dayLabel = format(date, "MMM d");
    const countCreatedUntil = deliverables.filter((d) => !isAfter(new Date(d.createdAt), date)).length;
    const countApprovedUntil = deliverables.filter(
      (d) => d.status === "approved" && !isAfter(new Date(d.createdAt), date)
    ).length;

    return {
      day: dayLabel,
      total: Math.max(countCreatedUntil, 1),
      approved: countApprovedUntil,
    };
  });

  const chartConfig = {
    approved: {
      label: "Approved Completed",
      colors: { light: ["#10b981"], dark: ["#34d399"] },
    },
    total: {
      label: "Total Tasks",
      colors: { light: ["#0ea5e9"], dark: ["#38bdf8"] },
    },
  } satisfies ChartConfig;

  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <span className="flex items-center gap-1 text-[12px] font-medium dark:text-neutral-400 py-0.5 ml-1">
        <PackageIcon className="h-5 w-5" /> Delivery Velocity & Milestone Progress
      </span>
      <div className="rounded-md bg-white p-4 dark:bg-neutral-950">
        {/* Header Section */}
        <div className="flex items-baseline justify-between gap-4 pb-6 border-b border-border/20 mb-6">
          <div>
            <span className="text-[18px] font-semibold block dark:text-neutral-300">
              {overallProgress}% Delivery Velocity
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {approvedCount} of {totalCount} deliverable{totalCount !== 1 ? "s" : ""} approved & completed
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground font-medium block">Total Tasks</span>
            <span className="text-[18px] font-semibold tabular-nums dark:text-neutral-200">
              {totalCount} Items
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* EvilCharts Static EChartsAreaChart */}
          <div className="md:col-span-6 flex flex-col items-center justify-center relative py-1">
            <div className="h-[180px] w-full">
              <EChartsAreaChart
                data={chartData}
                config={chartConfig}
                className="h-full w-full"
              >
                <EChartsAreaChart.Area dataKey="approved" />
                <EChartsAreaChart.XAxis dataKey="day" />
                <EChartsAreaChart.Tooltip />
              </EChartsAreaChart>
            </div>
        
          </div>

          {/* Category Breakdown Rows */}
          <div className="md:col-span-6 flex flex-col gap-1.5">
            {categories.map(({ name, label, value, count, swatch }, index) => (
              <div
                key={name}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-colors",
                  index % 2 === 0
                    ? "bg-muted/20 hover:bg-muted/40"
                    : "hover:bg-muted/20"
                )}
              >
                <span className={cn("size-3 shrink-0 rounded-xs", swatch)} />

                <span className="min-w-[3.5ch] text-xs font-bold text-foreground tabular-nums">
                  {value}%
                </span>

                <span className="text-xs font-medium text-muted-foreground">
                  {label}
                </span>

                <span className="ml-auto text-xs font-semibold text-foreground tabular-nums">
                  {count} task{count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
