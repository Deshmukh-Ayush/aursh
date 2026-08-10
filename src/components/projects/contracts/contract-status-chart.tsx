"use client";

import {
  EChartsRadialChart,
  type ChartConfig,
} from "@/components/evilcharts/charts/echarts-radial-chart";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";
import type { ContractWithSignatures } from "./contract-vault-client";

type ContractStatusChartProps = {
  contracts: ContractWithSignatures[];
};

export function ContractStatusChart({ contracts }: ContractStatusChartProps) {
  const totalCount = contracts.length;

  const signedCount = contracts.filter((c) => c.contract.status === "signed" || c.contract.status === "fully_signed").length;
  const pendingCount = contracts.filter((c) => c.contract.status === "pending_signature" || c.contract.status === "partially_signed" || c.contract.status === "sent").length;
  const draftCount = contracts.filter((c) => c.contract.status === "draft").length;

  const calcPercent = (count: number) => {
    if (totalCount <= 0) return 0;
    return Math.round((count / totalCount) * 100);
  };

  const chartData = [
    {
      name: "signed",
      label: "Fully Signed",
      value: calcPercent(signedCount),
      count: signedCount,
      swatch: "bg-emerald-500 dark:bg-emerald-400",
    },
    {
      name: "pending",
      label: "Pending Signature",
      value: calcPercent(pendingCount),
      count: pendingCount,
      swatch: "bg-sky-500 dark:bg-sky-400",
    },
    {
      name: "draft",
      label: "Draft Agreements",
      value: calcPercent(draftCount),
      count: draftCount,
      swatch: "bg-purple-600 dark:bg-purple-600",
    },
  ];

  const chartConfig = {
    signed: {
      label: "Fully Signed",
      colors: { light: ["#10b981"], dark: ["#34d399"] },
    },
    pending: {
      label: "Pending Signature",
      colors: { light: ["#0ea5e9"], dark: ["#38bdf8"] },
    },
    draft: {
      label: "Draft Agreements",
      colors: { light: ["#9333ea"], dark: ["#9333ea"] },
    },
  } satisfies ChartConfig;

  const complianceRate = calcPercent(signedCount);

  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <span className="flex items-center gap-1 text-[12px] font-medium dark:text-neutral-400 py-0.5">
        <Shield className="h-4 w-4 text-emerald-500" /> Legal Vault & E-Signature Compliance
      </span>
      <div className="rounded-md bg-white p-4 dark:bg-neutral-950">
        {/* Header Section */}
        <div className="flex items-baseline justify-between gap-4 pb-6 border-b border-border/20 mb-6">
          <div>
            <span className="text-[18px] font-semibold block dark:text-neutral-300">
              {complianceRate}% E-Signature Compliance
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {signedCount} of {totalCount} legal agreement{totalCount !== 1 ? "s" : ""} fully executed & hashed
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground font-medium block">Total Vaulted</span>
            <span className="text-[18px] font-semibold tabular-nums dark:text-neutral-200">
              {totalCount} Document{totalCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Radial Gauge Visual */}
          <div className="md:col-span-5 flex flex-col items-center justify-center relative py-1">
            <div className="flex items-center justify-center gap-4">
              {chartData.map((row) => (
                <div key={row.name} className="flex flex-col items-center gap-1.5">
                  <div className="aspect-square w-16 h-16">
                    <EChartsRadialChart
                      data={[row]}
                      config={chartConfig}
                      nameKey="name"
                      max={100}
                      innerRadius="70%"
                      outerRadius="100%"
                      className="h-full w-full"
                    >
                      <EChartsRadialChart.RadialBar
                        dataKey="value"
                        barSize={8}
                        cornerRadius={6}
                      />
                    </EChartsRadialChart>
                  </div>
                  <span className="w-full truncate text-center text-[11px] font-medium text-muted-foreground">
                    {row.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown Rows */}
          <div className="md:col-span-7 flex flex-col gap-1.5">
            {chartData.map(({ name, label, value, count, swatch }, index) => (
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
                  {count} agreement{count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
