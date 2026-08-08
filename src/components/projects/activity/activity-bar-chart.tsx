"use client";

import { EChartsBarChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-bar-chart";
import { format, subDays, isSameDay } from "date-fns";

type ActivityBarChartProps = {
  logs: Array<{
    log: {
      id: string;
      createdAt: Date;
      type: string;
    };
    actor: {
      name: string | null;
    } | null;
  }>;
};

export function ActivityBarChart({ logs }: ActivityBarChartProps) {
  // Generate last 14 days activity trend data
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => subDays(today, 13 - i));

  const chartData = days.map((d) => {
    const dayLabel = format(d, "MMM d");
    const count = logs.filter((l) => isSameDay(new Date(l.log.createdAt), d)).length;
    return {
      day: dayLabel,
      actions: count,
    };
  });

  const chartConfig = {
    actions: {
      label: "Audit Actions",
      colors: {
        light: ["#18181b"],
        dark: ["#fafafa"],
      },
    },
  } satisfies ChartConfig;

  const TOTAL = logs.length;
  const TOP = chartData.reduce((max, row) => (row.actions > max.actions ? row : max), chartData[0] || { day: "Today", actions: 0 });

  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <div className="rounded-md bg-white p-4 dark:bg-neutral-950 flex flex-col gap-4">
        {/* Monospace Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-row items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground font-mono text-[11px]">{"[#] Total Audit Events"}</span>
              <span className="text-primary font-mono text-2xl font-bold tracking-tight tabular-nums">
                {TOTAL.toLocaleString()}
              </span>
            </div>
            <hr className="h-8 border-l border-dashed border-border/60" />
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground font-mono text-[11px]">{"[⬆] Peak Activity Day"}</span>
              <span className="text-primary font-mono text-2xl font-bold tracking-tight">
                {TOP.day} <span className="text-xs text-muted-foreground font-normal tabular-nums">({TOP.actions})</span>
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-end gap-1 text-right sm:text-right">
            <span className="text-muted-foreground font-mono text-[10px]">
              {"// X-AXIS: "}
              <span className="text-primary font-semibold">14-DAY TIMELINE</span>
            </span>
            <span className="text-muted-foreground font-mono text-[10px]">
              {"// Y-AXIS: "}
              <span className="text-primary font-semibold">AUDIT EVENTS</span>
            </span>
          </div>
        </div>

        <hr className="border-t border-dashed border-border/40" />

        {/* EChartsBarChart Canvas Container */}
        <div className="h-[180px] w-full min-h-[180px] min-w-0">
          <EChartsBarChart
            data={chartData}
            config={chartConfig}
            xDataKey="day"
            className="h-full w-full min-h-[180px] min-w-0"
          >
            <EChartsBarChart.XAxis
              dataKey="day"
              tickFormatter={(value) => value}
              hideDots
            />
            <EChartsBarChart.Bar dataKey="actions" variant="expandable" />
          </EChartsBarChart>
        </div>
      </div>
    </div>
  );
}
