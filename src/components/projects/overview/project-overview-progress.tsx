import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { TimelineAreaChart } from "@/components/projects/timeline-area-chart";
import { ProjectOverviewCard } from "./project-overview-card";

type DeliverableStatusEntry = {
  key: "approved" | "in_review" | "revision_requested" | "pending";
  count: number;
};

type ProjectOverviewProgressProps = {
  projectId: string;
  chartData: Array<{ date: string; completed: number; expected: number }>;
  totalDelivs: number;
  approvedDelivs: number;
  inReviewDelivs: number;
  revisionDelivs: number;
  pendingDelivs: number;
};

const STATUS_CONFIG: Record<DeliverableStatusEntry["key"], { label: string; color: string }> = {
  approved: { label: "Approved", color: "text-emerald-600 dark:text-emerald-400" },
  in_review: { label: "In Review", color: "text-blue-600 dark:text-blue-400" },
  revision_requested: { label: "Revision", color: "text-red-600 dark:text-red-400" },
  pending: { label: "Pending", color: "text-muted-foreground" },
};

export function ProjectOverviewProgress({
  projectId,
  chartData,
  totalDelivs,
  approvedDelivs,
  inReviewDelivs,
  revisionDelivs,
  pendingDelivs,
}: ProjectOverviewProgressProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <ProjectOverviewCard className="lg:col-span-3" padding="md">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-foreground">Progress Over Time</h2>
          <Link
            href={`/projects/${projectId}/deliverables`}
            className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground group"
          >
            Deliverables <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <p className="mb-3 text-[12px] text-muted-foreground">
          Approved deliverables vs total over the project lifetime.
        </p>
        <TimelineAreaChart data={chartData} />
      </ProjectOverviewCard>

      <ProjectOverviewCard className="flex flex-col lg:col-span-2" padding="md">
        <h2 className="mb-4 text-[13px] font-semibold text-foreground">Deliverable Status</h2>

        {totalDelivs === 0 ? (
          <div className="flex flex-1 items-center justify-center py-6 text-center">
            <div>
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-[13px] text-muted-foreground">No deliverables yet</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-3">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-muted/30">
              {approvedDelivs > 0 && (
                <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${(approvedDelivs / totalDelivs) * 100}%` }} />
              )}
              {inReviewDelivs > 0 && (
                <div className="bg-blue-500 transition-all duration-500" style={{ width: `${(inReviewDelivs / totalDelivs) * 100}%` }} />
              )}
              {revisionDelivs > 0 && (
                <div className="bg-red-500 transition-all duration-500" style={{ width: `${(revisionDelivs / totalDelivs) * 100}%` }} />
              )}
              {pendingDelivs > 0 && (
                <div className="bg-zinc-300 transition-all duration-500 dark:bg-zinc-600" style={{ width: `${(pendingDelivs / totalDelivs) * 100}%` }} />
              )}
            </div>

            <div className="space-y-2 pt-1">
              {([
                { key: "approved", count: approvedDelivs },
                { key: "in_review", count: inReviewDelivs },
                { key: "revision_requested", count: revisionDelivs },
                { key: "pending", count: pendingDelivs },
              ] as DeliverableStatusEntry[]).map(({ key, count }) => {
                if (count === 0) return null;
                const config = STATUS_CONFIG[key];
                const statusKey = key === "in_review" ? "in_review" : key;
                const Icon =
                  statusKey === "approved"
                    ? CheckCircle2
                    : statusKey === "in_review"
                      ? CheckCircle2
                      : statusKey === "revision_requested"
                        ? CheckCircle2
                        : CheckCircle2;

                return (
                  <div key={key} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${config.color}`} />
                      <span className="text-[13px] text-foreground">{config.label}</span>
                    </div>
                    <span className="text-[13px] font-semibold tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ProjectOverviewCard>
    </div>
  );
}
