"use client";

import { EChartsRadialChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-radial-chart";
import { cn } from "@/lib/utils";
import type { MilestoneWithDetails } from "@/store/types";
import { ChartPieSliceIcon } from "@phosphor-icons/react";

type PaymentsRadialChartProps = {
  milestones: MilestoneWithDetails[];
  formatMoney: (amountInUnits: number, curr?: string) => string;
};

export function PaymentsRadialChart({ milestones, formatMoney }: PaymentsRadialChartProps) {
  const totalProjectValue = milestones.reduce((sum, m) => sum + m.amount, 0);

  const collectedAmount = milestones
    .filter((m) => m.status === "paid")
    .reduce((sum, m) => sum + m.amount, 0);

  const dueAmount = milestones
    .filter((m) => m.status === "due")
    .reduce((sum, m) => sum + m.amount, 0);

  const overdueAmount = milestones
    .filter((m) => m.status === "overdue" || (m.status === "due" && m.dueDate && new Date(m.dueDate) < new Date()))
    .reduce((sum, m) => sum + m.amount, 0);

  const upcomingAmount = milestones
    .filter((m) => m.status === "upcoming")
    .reduce((sum, m) => sum + m.amount, 0);

  const calcPercent: (amt: number) => number = (amt) => {
    if (totalProjectValue <= 0) return 0;
    return Math.round((amt / totalProjectValue) * 100);
  };

  const chartData = [
    {
      name: "collected",
      label: "Collected",
      value: calcPercent(collectedAmount),
      amount: collectedAmount,
      swatch: "bg-[#10b981] dark:bg-[#34d399]",
    },
    {
      name: "due",
      label: "Payment Due",
      value: calcPercent(dueAmount),
      amount: dueAmount,
      swatch: "bg-[#3b82f6] dark:bg-[#60a5fa]",
    },
    {
      name: "overdue",
      label: "Overdue",
      value: calcPercent(overdueAmount),
      amount: overdueAmount,
      swatch: "bg-[#f43f5e] dark:bg-[#fb7185]",
    },
    {
      name: "upcoming",
      label: "Upcoming",
      value: calcPercent(upcomingAmount),
      amount: upcomingAmount,
      swatch: "bg-[#64748b] dark:bg-[#94a3b8]",
    },
  ];

  const chartConfig = {
    collected: { label: "Collected", colors: { light: ["#10b981"], dark: ["#34d399"] } },
    due: { label: "Payment Due", colors: { light: ["#3b82f6"], dark: ["#60a5fa"] } },
    overdue: { label: "Overdue", colors: { light: ["#f43f5e"], dark: ["#fb7185"] } },
    upcoming: { label: "Upcoming", colors: { light: ["#64748b"], dark: ["#94a3b8"] } },
  } satisfies ChartConfig;

  return (
    <div className="flex w-full flex-col gap-2 p-2 rounded-md border border-border/40 shadow-xs bg-neutral-100 dark:bg-neutral-900">
        <span className="dark:text-neutral-400 text-[12px] font-medium flex gap-1 items-center">
          <ChartPieSliceIcon className="h-5 w-5" /> Financial Portfolio Breakdown
        </span>
      <div className="p-4 bg-neutral-950 rounded-md">
        <div className="flex items-baseline justify-between gap-4 border-b border-border/30 pb-3">
        <div className="text-right">
          <span className="text-[18px] dark:text-neutral-300 mr-1.5 font-semibold">Total Scheduled:</span>
          <span className="dark:text-neutral-200 text-[18px] font-semibold tabular-nums">
            {formatMoney(totalProjectValue)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-3">
        <div className="grid shrink-0 grid-cols-2 md:grid-cols-4 gap-2">
        {chartData.map((row) => (
          <div key={row.name} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-muted/20 border border-border/30">
            <div className="aspect-square w-full max-w-16">
              <EChartsRadialChart
                data={[row]}
                config={chartConfig}
                nameKey="name"
                max={100}
                innerRadius="66%"
                outerRadius="100%"
                className="h-full w-full"
              >
                <EChartsRadialChart.RadialBar dataKey="value" barSize={8} cornerRadius={6} />
              </EChartsRadialChart>
            </div>
            <span className="text-muted-foreground w-full truncate text-center text-xs font-medium">
              {row.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {chartData.map(({ name, label, value, amount, swatch }) => (
          <div
            key={name}
            className="bg-muted/30 hover:bg-muted/50 transition-colors flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 border border-border/30"
          >
            <span className={cn("size-2.5 shrink-0 rounded-full", swatch)} />
            <span className="text-foreground text-xs font-bold tabular-nums">{value}%</span>
            <span className="text-muted-foreground truncate text-xs font-medium">{label}</span>
            <span className="text-foreground ml-auto text-xs font-semibold tabular-nums">
              {formatMoney(amount)}
            </span>
          </div>
        ))}
      </div>
      </div>
      </div>
    </div>
  );
}
