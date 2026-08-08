"use client";

import { useMemo } from "react";
import type { OverviewDeliverable } from "./project-overview-types";
import { EChartsRadialChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-radial-chart";
import { cn } from "@/lib/utils";

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
      { name: "approved", label: "Approved", value: calcPercent(rawCounts.approved), count: rawCounts.approved, swatch: "bg-emerald-500" },
      { name: "in_review", label: "In Review", value: calcPercent(rawCounts.in_review), count: rawCounts.in_review, swatch: "bg-sky-500" },
      { name: "revision_requested", label: "Needs Revision", value: calcPercent(rawCounts.revision_requested), count: rawCounts.revision_requested, swatch: "bg-rose-500" },
      { name: "pending", label: "Pending", value: calcPercent(rawCounts.pending), count: rawCounts.pending, swatch: "bg-purple-500" },
    ];

    return { chartData: rows, counts: rawCounts };
  }, [deliverables, total]);

  const chartConfig = {
    approved: { label: "Approved", colors: { light: ["#10b981"], dark: ["#34d399"] } },
    in_review: { label: "In Review", colors: { light: ["#0ea5e9"], dark: ["#38bdf8"] } },
    revision_requested: { label: "Needs Revision", colors: { light: ["#f43f5e"], dark: ["#fb7185"] } },
    pending: { label: "Pending", colors: { light: ["#9333ea"], dark: ["#a855f7"] } },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col h-full rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <div className="rounded-md bg-white p-4 dark:bg-neutral-950 flex flex-col h-full justify-between gap-4">
        <div>
          <h2 className="text-[14px] font-semibold tracking-tight text-foreground">
            Deliverable Status Breakdown
          </h2>
          <p className="text-[12px] text-muted-foreground">Scope distribution across states</p>
        </div>

        <div className="flex items-center gap-4">
          {/* EvilCharts Radial Gauge */}
          <div className="aspect-square w-24 h-24 shrink-0 relative">
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
                barSize={6}
                cornerRadius={4}
              />
            </EChartsRadialChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-bold tabular-nums text-foreground">
                {counts.approved}/{total}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase font-semibold">Done</span>
            </div>
          </div>

          {/* Breakdown Legend List */}
          <div className="flex-1 space-y-1.5">
            {chartData.map((row) => (
              <div key={row.name} className="flex items-center gap-2 text-xs">
                <span className={cn("size-2.5 rounded-xs shrink-0", row.swatch)} />
                <span className="text-muted-foreground font-medium">{row.label}</span>
                <span className="ml-auto font-semibold tabular-nums text-foreground">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
