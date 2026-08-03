"use client";

import { useMemo } from "react";
import { Pie, PieChart, Cell } from "recharts";
import type { OverviewDeliverable } from "./project-overview-types";
import { ProjectOverviewCard } from "./project-overview-card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type ProjectOverviewStatusChartProps = {
  deliverables: OverviewDeliverable[];
};

const STATUS_CONFIG = {
  approved: { fill: "#10b981", label: "Approved" },
  in_review: { fill: "#3b82f6", label: "In Review" },
  revision_requested: { fill: "#ef4444", label: "Revision" },
  pending: { fill: "#a1a1aa", label: "Pending" },
};

const chartConfig = {
  approved: { label: "Approved", color: STATUS_CONFIG.approved.fill },
  in_review: { label: "In Review", color: STATUS_CONFIG.in_review.fill },
  revision_requested: { label: "Revision", color: STATUS_CONFIG.revision_requested.fill },
  pending: { label: "Pending", color: STATUS_CONFIG.pending.fill },
} satisfies ChartConfig;

export function ProjectOverviewStatusChart({
  deliverables,
}: ProjectOverviewStatusChartProps) {
  const total = deliverables.length;

  const { data, counts } = useMemo(() => {
    const rawCounts: Record<string, number> = { pending: 0, in_review: 0, revision_requested: 0, approved: 0 };
    for (const d of deliverables) {
      if (rawCounts[d.status] !== undefined) rawCounts[d.status]++;
    }

    const pieData = Object.entries(rawCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        status,
        count,
        fill: `var(--color-${status})`,
      }));

    return { data: pieData, counts: rawCounts };
  }, [deliverables]);

  return (
    <ProjectOverviewCard padding="md" className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-[14px] font-semibold tracking-tight text-foreground">
          Deliverable Status
        </h2>
        <p className="text-[12px] text-muted-foreground">Overall completion progress</p>
      </div>

      <div className="flex flex-1 items-center gap-6">
        {/* Donut chart */}
        <div className="relative h-28 w-28 shrink-0">
          <ChartContainer config={chartConfig} className="h-full w-full min-h-[112px]">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel className="tabular-nums" />}
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                innerRadius={32}
                outerRadius={44}
                strokeWidth={2}
                stroke="hsl(var(--background))"
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold tabular-nums text-foreground leading-none">
              {total > 0 ? `${counts.approved}/${total}` : "0"}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <div key={status} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: config.fill }} />
              <span className="text-[12px] text-muted-foreground">{config.label}</span>
              <span className="ml-auto text-[12px] font-medium tabular-nums text-foreground">{counts[status] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    </ProjectOverviewCard>
  );
}
