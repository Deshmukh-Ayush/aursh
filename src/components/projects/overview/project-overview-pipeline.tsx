import Link from "next/link";
import type { OverviewDeliverable } from "./project-overview-types";
import { ProjectOverviewCard } from "./project-overview-card";

type ProjectOverviewPipelineProps = {
  projectId: string;
  deliverables: OverviewDeliverable[];
};

const COLUMNS = [
  { id: "pending" as const, label: "Pending", dotClass: "bg-zinc-400 dark:bg-zinc-500", bgClass: "bg-zinc-500/[0.03] dark:bg-zinc-400/[0.03]" },
  { id: "in_review" as const, label: "In Review", dotClass: "bg-blue-500", bgClass: "bg-blue-500/[0.04] dark:bg-blue-400/[0.04]" },
  { id: "revision_requested" as const, label: "Revision", dotClass: "bg-red-500", bgClass: "bg-red-500/[0.04] dark:bg-red-400/[0.04]" },
  { id: "approved" as const, label: "Approved", dotClass: "bg-emerald-500", bgClass: "bg-emerald-500/[0.04] dark:bg-emerald-400/[0.04]" },
] as const;

const MAX_VISIBLE = 4;

export function ProjectOverviewPipeline({ projectId, deliverables }: ProjectOverviewPipelineProps) {
  // `js-combine-iterations`: single pass to bucket deliverables by status
  const buckets: Record<string, OverviewDeliverable[]> = { pending: [], in_review: [], revision_requested: [], approved: [] };
  for (const d of deliverables) {
    const bucket = buckets[d.status];
    if (bucket) bucket.push(d);
  }

  return (
    <ProjectOverviewCard padding="md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">Deliverable Pipeline</h2>
        <Link
          href={`/projects/${projectId}/deliverables`}
          className="group flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-all hover:text-foreground active:scale-[0.96]"
        >
          View board <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = buckets[col.id] ?? [];
          const visible = items.slice(0, MAX_VISIBLE);
          const overflow = items.length - MAX_VISIBLE;

          return (
            <div key={col.id} className={`rounded-lg p-3 ${col.bgClass}`}>
              {/* Column header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${col.dotClass}`} />
                  <span className="text-[11px] font-medium text-muted-foreground">{col.label}</span>
                </div>
                <span className="text-[11px] tabular-nums font-medium text-muted-foreground">{items.length}</span>
              </div>

              {/* Deliverable mini-cards */}
              <div className="space-y-1.5">
                {visible.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border/40 px-2.5 py-3 text-center">
                    <span className="text-[11px] text-muted-foreground/60">—</span>
                  </div>
                ) : (
                  visible.map((item) => {
                    const dueDateStr = item.dueDate
                      ? new Date(item.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                      : null;

                    return (
                      <div
                        key={item.id}
                        className="rounded-md bg-background px-2.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.04)]"
                      >
                        <p className="text-[12px] font-medium text-foreground leading-snug line-clamp-1">
                          {item.title}
                        </p>
                        {dueDateStr ? (
                          <p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">{dueDateStr}</p>
                        ) : null}
                      </div>
                    );
                  })
                )}
                {overflow > 0 ? (
                  <p className="text-center text-[10px] font-medium text-muted-foreground">
                    +{overflow} more
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </ProjectOverviewCard>
  );
}
