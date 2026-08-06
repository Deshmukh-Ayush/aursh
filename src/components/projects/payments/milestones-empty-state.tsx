import { CreditCard } from "lucide-react";

type MilestonesEmptyStateProps = {
  isAgency: boolean;
  onCreateMilestone: () => void;
};

export function MilestonesEmptyState({ isAgency, onCreateMilestone }: MilestonesEmptyStateProps) {
  return (
    <div className="rounded-[20px] border border-dashed border-border/60 p-16 flex flex-col items-center justify-center text-center bg-muted/20">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground">
        <CreditCard className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="text-[15px] font-semibold text-foreground">No payment milestones</h3>
      <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
        Payment milestones will be automatically created when proposals are accepted, or you can add them manually.
      </p>
      {isAgency && (
        <button
          onClick={onCreateMilestone}
          className="active:scale-[0.96] transition-transform duration-150 mt-5 rounded-full px-4 py-2 bg-foreground text-background text-[13px] font-medium shadow-xs"
        >
          Create First Milestone
        </button>
      )}
    </div>
  );
}
