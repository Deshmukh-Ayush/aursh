"use client";

import { useMemo } from "react";
import type { OverviewDeliverable } from "./project-overview-types";
import { EChartsRadialChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-radial-chart";
import { cn } from "@/lib/utils";
import { ChartPieSliceIcon } from "@phosphor-icons/react";

type ProjectOverviewStatusChartProps = {
  deliverables: OverviewDeliverable[];
};

export function ProjectOverviewStatusChart({
  deliverables,
}: ProjectOverviewStatusChartProps) {
  const total = deliverables.length;

  const { chartData, counts } = useMemo(() => {
    const rawCounts: Record<string, number> = { pending: 0, in_review: 0, revision_requested: 0, approved: 0 };
    for (const d of deliverables) {
      if (rawCounts[d.status] !== undefined) rawCounts[d.status]++;
    }

    const calcPercent = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

    const rows = [
      { name: "approved", label: "Approved & Completed", value: calcPercent(rawCounts.approved), count: rawCounts.approved, swatch: "bg-emerald-500", barColor: "bg-emerald-500" },
      { name: "in_review", label: "Submitted for Review", value: calcPercent(rawCounts.in_review), count: rawCounts.in_review, swatch: "bg-sky-500", barColor: "bg-sky-500" },
      { name: "revision_requested", label: "Revision Requested", value: calcPercent(rawCounts.revision_requested), count: rawCounts.revision_requested, swatch: "bg-rose-500", barColor: "bg-rose-500" },
      { name: "pending", label: "Pending Execution", value: calcPercent(rawCounts.pending), count: rawCounts.pending, swatch: "bg-purple-500", barColor: "bg-purple-500" },
    ];

    return { chartData: rows, counts: rawCounts };
  }, [deliverables, total]);

  const chartConfig = {
    approved: { label: "Approved & Completed", colors: { light: ["#10b981"], dark: ["#34d399"] } },
    in_review: { label: "Submitted for Review", colors: { light: ["#0ea5e9"], dark: ["#38bdf8"] } },
    revision_requested: { label: "Revision Requested", colors: { light: ["#f43f5e"], dark: ["#fb7185"] } },
    pending: { label: "Pending Execution", colors: { light: ["#9333ea"], dark: ["#a855f7"] } },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col h-full rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <span className="flex items-center gap-1.5 text-[12px] font-medium dark:text-neutral-400 py-0.5 px-1">
        <ChartPieSliceIcon className="h-4 w-4 text-brand" /> Deliverable Status Distribution
      </span>
      <div className="rounded-md bg-white p-5 dark:bg-neutral-950 flex flex-col h-full justify-between gap-5">
        {/* Header */}
        <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-border/20">
          <div>
            <h2 className="text-[16px] font-semibold tracking-tight text-foreground text-balance">
              Scope Breakdown
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Deliverables progress across workflow stages
            </p>
          </div>
          <span className="text-[16px] font-semibold tabular-nums text-foreground shrink-0">
            {counts.approved}/{total} Approved
          </span>
        </div>

        {/* Center: Radial Gauge + Legend Bars */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Radial Chart Visual */}
          <div className="aspect-square w-28 h-28 shrink-0 relative">
            <EChartsRadialChart
              data={chartData}
              config={chartConfig}
              nameKey="name"
              max={100}
              innerRadius="65%"
              outerRadius="100%"
              className="h-full w-full"
            >
              <EChartsRadialChart.RadialBar
                dataKey="value"
                barSize={7}
                cornerRadius={4}
              />
            </EChartsRadialChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold tabular-nums text-foreground leading-none">
                {total > 0 ? Math.round((counts.approved / total) * 100) : 0}%
              </span>
              <span className="text-[9px] text-muted-foreground uppercase font-semibold mt-0.5">Complete</span>
            </div>
          </div>

          {/* Breakdown Rows with Progress Meters */}
          <div className="flex-1 space-y-2.5 w-full">
            {chartData.map((row) => (
              <div key={row.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-xs shrink-0", row.swatch)} />
                    <span className="text-muted-foreground font-medium">{row.label}</span>
                  </div>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="font-bold text-foreground">{row.count}</span>
                    <span className="text-[11px] text-muted-foreground">({row.value}%)</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", row.barColor)}
                    style={{ width: `${row.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
