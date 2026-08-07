"use client";

import { cn } from "@/lib/utils";

type PaymentsSummaryCardsProps = {
  projectValue: number;
  collected: number;
  outstanding: number;
  overdueCount: number;
  paidPercentage: number;
  milestonesCount: number;
  formatMoney: (amountInUnits: number, curr?: string) => string;
};

export function PaymentsSummaryCards({
  projectValue,
  collected,
  outstanding,
  overdueCount,
  paidPercentage,
  milestonesCount,
  formatMoney,
}: PaymentsSummaryCardsProps) {
  const listItems = [
    {
      title: "Project Value",
      value: formatMoney(projectValue),
      extra: `${milestonesCount} total milestone${milestonesCount === 1 ? "" : "s"}`,
    },
    {
      title: "Collected",
      value: formatMoney(collected),
      extra: (
        <div className="flex items-center gap-2">
          <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
            <div
              className="bg-foreground h-full transition-all duration-300"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">{paidPercentage}%</span>
        </div>
      ),
    },
    {
      title: "Outstanding",
      value: formatMoney(outstanding),
      extra: `${100 - paidPercentage}% remaining`,
    },
    {
      title: "Overdue",
      value: overdueCount.toString(),
      extra: overdueCount > 0 ? "Action required" : "On track",
    },
  ];

  return (
    <div className="flex flex-col rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <div>
        {listItems.map((item, index) => (
        <div
          key={item.title}
          className={cn(
            "flex items-center justify-between px-4 py-3.5 hover:bg-muted/10 transition-colors",
            index !== listItems.length - 1 && "border-b border-border/40"
          )}
        >
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="text-sm font-medium text-foreground w-28">
              {item.title}
            </span>
            {typeof item.extra === "string" ? (
              <span className="text-xs text-muted-foreground hidden sm:inline-block">
                {item.extra}
              </span>
            ) : (
              item.extra
            )}
          </div>
          
          <div className="text-sm font-semibold tracking-tight tabular-nums text-foreground">
            {item.value}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}