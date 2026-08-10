import Link from "next/link";
import type { OverviewDeliverable } from "./project-overview-types";

type ProjectOverviewPipelineProps = {
  projectId: string;
  deliverables: OverviewDeliverable[];
};

const COLUMNS = [
  { id: "pending" as const, label: "Pending", dotClass: "bg-muted-foreground", bgClass: "bg-muted/30 border-border/30" },
  { id: "in_review" as const, label: "In Review", dotClass: "bg-sky-500", bgClass: "bg-muted/30 border-border/30" },
  { id: "revision_requested" as const, label: "Revision", dotClass: "bg-rose-500", bgClass: "bg-muted/30 border-border/30" },
  { id: "approved" as const, label: "Approved", dotClass: "bg-emerald-500", bgClass: "bg-muted/30 border-border/30" },
] as const;

const MAX_VISIBLE = 3;

export function ProjectOverviewPipeline({ projectId, deliverables }: ProjectOverviewPipelineProps) {
  const buckets: Record<string, OverviewDeliverable[]> = { pending: [], in_review: [], revision_requested: [], approved: [] };
  for (const d of deliverables) {
    const bucket = buckets[d.status];
    if (bucket) bucket.push(d);
  }

  return (
    <div className="flex flex-col h-full rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <div className="rounded-md bg-white p-4 dark:bg-neutral-950 flex flex-col h-full justify-between gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold tracking-tight text-foreground">
              Deliverables Scope Pipeline
            </h2>
            <p className="text-[12px] text-muted-foreground">Active work items grouped by progress state</p>
          </div>
          <Link
            href={`/projects/${projectId}/deliverables`}
            className="group flex items-center gap-1 text-xs font-semibold text-[#00AAF7] hover:underline"
          >
            View all <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = buckets[col.id] ?? [];
            const visible = items.slice(0, MAX_VISIBLE);
            const overflow = items.length - MAX_VISIBLE;

            return (
              <div key={col.id} className={`rounded-md p-2.5 border ${col.bgClass} flex flex-col justify-between`}>
                <div>
                  <div className="mb-2 flex items-center justify-between pb-1.5 border-b border-border/20">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${col.dotClass}`} />
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{col.label}</span>
                    </div>
                    <span className="text-[11px] tabular-nums font-bold text-foreground">{items.length}</span>
                  </div>

                  <div className="space-y-1.5">
                    {visible.length === 0 ? (
                      <div className="rounded border border-dashed border-border/30 p-2 text-center">
                        <span className="text-[10px] text-muted-foreground/60">—</span>
                      </div>
                    ) : (
                      visible.map((item) => (
                        <div
                          key={item.id}
                          className="rounded bg-background p-2 border border-border/40 shadow-xs"
                        >
                          <p className="text-xs font-medium text-foreground leading-tight truncate">
                            {item.title}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {overflow > 0 && (
                  <p className="mt-2 text-center text-[10px] font-semibold text-muted-foreground tabular-nums">
                    +{overflow} more
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
