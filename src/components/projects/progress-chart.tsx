"use client";

import { Pie, PieChart, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export function ProgressChart({ approved, total }: { approved: number, total: number }) {
  const pending = total - approved;
  const progress = total === 0 ? 0 : Math.round((approved / total) * 100);

  const data = [
    { name: "Approved", value: approved, fill: "var(--color-approved)" },
    { name: "Pending", value: pending, fill: "var(--color-pending)" },
  ];

  if (total === 0) {
    return (
      <div className="flex h-32 w-full flex-col items-center justify-center rounded-lg border border-dashed border-muted bg-muted/20">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">No Deliverables</span>
      </div>
    );
  }

  return (
    <div className="relative flex h-40 w-full items-center justify-center">
      <ChartContainer
        config={{
          approved: {
            label: "Approved",
            color: "var(--primary)",
          },
          pending: {
            label: "Pending",
            color: "hsl(var(--muted))",
          },
        }}
        className="h-full w-full max-w-40"
      >
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={70}
            strokeWidth={0}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} className="transition-all duration-500 hover:opacity-80" />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold tabular-nums text-foreground leading-none">{progress}%</span>
      </div>
    </div>
  );
}
