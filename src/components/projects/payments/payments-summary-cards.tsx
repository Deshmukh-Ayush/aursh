"use client";

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
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="p-4 rounded-[18px] bg-card border border-border/40 space-y-1.5 shadow-xs">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Project Value</span>
        <div className="text-[20px] font-semibold text-foreground tracking-tight tabular-nums">
          {formatMoney(projectValue)}
        </div>
        <p className="text-[11px] text-muted-foreground">{milestonesCount} total milestone(s)</p>
      </div>

      <div className="p-4 rounded-[18px] bg-card border border-border/40 space-y-1.5 shadow-xs">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Collected</span>
        <div className="text-[20px] font-semibold text-foreground tracking-tight tabular-nums">
          {formatMoney(collected)}
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div className="bg-foreground h-full transition-all duration-300" style={{ width: `${paidPercentage}%` }} />
        </div>
      </div>

      <div className="p-4 rounded-[18px] bg-card border border-border/40 space-y-1.5 shadow-xs">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Outstanding</span>
        <div className="text-[20px] font-semibold text-foreground tracking-tight tabular-nums">
          {formatMoney(outstanding)}
        </div>
        <p className="text-[11px] text-muted-foreground">{100 - paidPercentage}% remaining</p>
      </div>

      <div className="p-4 rounded-[18px] bg-card border border-border/40 space-y-1.5 shadow-xs">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Overdue</span>
        <div className="text-[20px] font-semibold text-foreground tracking-tight tabular-nums">
          {overdueCount}
        </div>
        <p className="text-[11px] text-muted-foreground">Action required</p>
      </div>
    </div>
  );
}
