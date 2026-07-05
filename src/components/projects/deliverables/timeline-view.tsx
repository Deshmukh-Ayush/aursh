"use client";

import { useMemo, useState } from "react";
import { format, differenceInDays, addDays, isPast, isBefore, isAfter } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CommentThread } from "@/components/projects/discussions/comment-thread";
import { MessageSquare, Calendar, Clock, CheckCircle2, Eye, AlertCircle, Hourglass } from "lucide-react";
import { DeliverableActions } from "./deliverable-actions";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; bg: string; bar: string; text: string; icon: typeof CheckCircle2 }> = {
  approved: { label: "Approved", bg: "bg-emerald-500/8", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  in_review: { label: "In Review", bg: "bg-blue-500/8", bar: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", icon: Eye },
  revision_requested: { label: "Revision", bg: "bg-red-500/8", bar: "bg-red-500", text: "text-red-600 dark:text-red-400", icon: AlertCircle },
  pending: { label: "Pending", bg: "bg-zinc-500/8", bar: "bg-zinc-400 dark:bg-zinc-500", text: "text-muted-foreground", icon: Hourglass },
};

export function TimelineView({
  deliverables,
  allComments,
  memberRole,
  projectId,
  userId
}: {
  deliverables: any[];
  allComments: any[];
  memberRole: string;
  projectId: string;
  userId: string;
}) {
  const [selectedDeliv, setSelectedDeliv] = useState<any | null>(null);

  const { startDate, endDate, totalDays, gridDates, todayPct } = useMemo(() => {
    if (deliverables.length === 0) {
      const s = new Date();
      const e = addDays(s, 14);
      return { startDate: s, endDate: e, totalDays: 14, gridDates: [], todayPct: 50 };
    }

    let minDate = new Date();
    let maxDate = new Date();

    deliverables.forEach(d => {
      const created = new Date(d.createdAt);
      const due = d.dueDate ? new Date(d.dueDate) : addDays(created, 7);
      if (isBefore(created, minDate)) minDate = created;
      if (isAfter(due, maxDate)) maxDate = due;
      if (isAfter(created, maxDate)) maxDate = created;
    });

    // Add buffers
    minDate = addDays(minDate, -3);
    maxDate = addDays(maxDate, 14);

    const total = Math.max(7, differenceInDays(maxDate, minDate));

    // Generate grid dates — roughly every 1/6 of the range
    const step = Math.max(1, Math.floor(total / 6));
    const dates = [];
    for (let i = 0; i <= total; i += step) {
      dates.push(addDays(minDate, i));
    }

    const today = new Date();
    const tPct = Math.max(0, Math.min(100, (differenceInDays(today, minDate) / total) * 100));

    return { startDate: minDate, endDate: maxDate, totalDays: total, gridDates: dates, todayPct: tPct };
  }, [deliverables]);

  if (deliverables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-muted/20 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="rounded-xl bg-muted/50 p-4 mb-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <Calendar className="h-7 w-7 text-muted-foreground/60" />
        </div>
        <h3 className="text-base font-semibold tracking-tight" style={{ textWrap: 'balance' as any }}>No timeline to display</h3>
        <p className="text-muted-foreground mt-1.5 max-w-sm text-[13px] leading-relaxed" style={{ textWrap: 'pretty' as any }}>
          Add deliverables with due dates to see your project timeline here.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Timeline Container */}
      <div className="rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.04)] bg-background">
        {/* Scrollable area */}
        <div className="overflow-x-auto scrollbar-thin">
          <div className="min-w-[700px]">

            {/* Date header */}
            <div className="relative h-10 border-b border-border/30 flex items-end">
              {gridDates.map((date, i) => {
                const pct = (differenceInDays(date, startDate) / totalDays) * 100;
                return (
                  <div
                    key={i}
                    className="absolute bottom-2 text-[11px] text-muted-foreground tabular-nums font-medium"
                    style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
                  >
                    {format(date, "MMM d")}
                  </div>
                );
              })}

              {/* Today pill in header */}
              {todayPct >= 0 && todayPct <= 100 && (
                <div
                  className="absolute bottom-1.5 z-10"
                  style={{ left: `${todayPct}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
                    Today
                  </div>
                </div>
              )}
            </div>

            {/* Rows */}
            <div className="relative">
              {/* Grid columns */}
              <div className="absolute inset-0 pointer-events-none" aria-hidden>
                {gridDates.map((date, i) => {
                  const pct = (differenceInDays(date, startDate) / totalDays) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 w-px bg-border/20"
                      style={{ left: `${pct}%` }}
                    />
                  );
                })}

                {/* Today marker line */}
                {todayPct >= 0 && todayPct <= 100 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary/30"
                    style={{
                      left: `${todayPct}%`,
                      backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 4px, hsl(var(--primary) / 0.3) 4px, hsl(var(--primary) / 0.3) 8px)',
                      background: undefined
                    }}
                  >
                    <div
                      className="absolute top-0 bottom-0 w-0.5"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(to bottom, hsl(var(--primary) / 0.4) 0px, hsl(var(--primary) / 0.4) 4px, transparent 4px, transparent 8px)',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Deliverable rows */}
              {deliverables.map((deliv, index) => {
                const created = new Date(deliv.createdAt);
                const due = deliv.dueDate ? new Date(deliv.dueDate) : addDays(created, 7);
                const isOverdue = deliv.dueDate && isPast(new Date(deliv.dueDate)) && deliv.status !== 'approved';
                const commentsCount = allComments.filter(c => c.comment.deliverableId === deliv.id).length;

                let leftPct = Math.max(0, (differenceInDays(created, startDate) / totalDays) * 100);
                let rightPct = Math.min(100, (differenceInDays(due, startDate) / totalDays) * 100);
                let widthPct = rightPct - leftPct;
                if (widthPct < 3) widthPct = 3; // minimum 3% for clickability / visibility

                const config = STATUS_CONFIG[deliv.status] || STATUS_CONFIG.pending;
                const StatusIcon = config.icon;

                return (
                  <div
                    key={deliv.id}
                    className="relative h-14 flex items-center group hover:bg-muted/30 transition-colors cursor-pointer border-b border-border/10 last:border-0"
                    onClick={() => setSelectedDeliv(deliv)}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    {/* The bar */}
                    <div
                      className={`absolute h-8 rounded-md ${config.bar} transition-[opacity,transform] group-hover:scale-y-110 origin-center`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        opacity: deliv.status === 'approved' ? 0.7 : 0.85,
                      }}
                    >
                      {/* Inner label — only show if bar is wide enough */}
                      {widthPct > 12 && (
                        <div className="absolute inset-0 flex items-center px-2.5 overflow-hidden">
                          <span className="text-white text-[11px] font-semibold truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
                            {deliv.title}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Label outside bar if bar is too small */}
                    {widthPct <= 12 && (
                      <div
                        className="absolute flex items-center gap-1.5 text-[12px] font-medium text-foreground group-hover:text-primary transition-colors"
                        style={{ left: `calc(${leftPct + widthPct}% + 8px)` }}
                      >
                        <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${config.text}`} />
                        <span className="truncate max-w-[200px]">{deliv.title}</span>
                      </div>
                    )}

                    {/* Right-side info chip — always visible */}
                    <div
                      className="absolute right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isOverdue && (
                        <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20 shadow-none text-[10px] font-semibold px-1.5 py-0">
                          Overdue
                        </Badge>
                      )}
                      {commentsCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
                          <MessageSquare className="w-3 h-3" />
                          {commentsCount}
                        </span>
                      )}
                      <span className={`text-[10px] font-medium ${config.text}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border/20 bg-muted/10">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${cfg.bar}`} />
              <span className="text-[11px] text-muted-foreground font-medium">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedDeliv} onOpenChange={(open) => !open && setSelectedDeliv(null)}>
        {selectedDeliv && (() => {
          const isOverdue = selectedDeliv.dueDate && isPast(new Date(selectedDeliv.dueDate)) && selectedDeliv.status !== 'approved';
          const delivComments = allComments.filter(c => c.comment.deliverableId === selectedDeliv.id);
          const config = STATUS_CONFIG[selectedDeliv.status] || STATUS_CONFIG.pending;

          return (
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader className="mb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <DialogTitle className="text-lg font-semibold tracking-tight" style={{ textWrap: 'balance' as any }}>{selectedDeliv.title}</DialogTitle>
                      <Badge variant="secondary" className={`${config.bg} ${config.text} border-0 shadow-none text-[11px] font-semibold shrink-0`}>
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[13px] text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="tabular-nums">{format(new Date(selectedDeliv.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      {selectedDeliv.dueDate && (
                        <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span className="tabular-nums">
                            Due {format(new Date(selectedDeliv.dueDate), 'MMM d, yyyy')}
                            {isOverdue && ' · Overdue'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <DeliverableActions
                      deliverableId={selectedDeliv.id}
                      status={selectedDeliv.status}
                      role={memberRole}
                    />
                  </div>
                </div>
                {selectedDeliv.description && (
                  <DialogDescription className="mt-3 text-foreground/70 leading-relaxed text-[13px]" style={{ textWrap: 'pretty' as any }}>
                    {selectedDeliv.description}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="border-t border-border/30 pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-[13px]">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Discussions
                  {delivComments.length > 0 && (
                    <span className="text-muted-foreground font-normal tabular-nums">({delivComments.length})</span>
                  )}
                </h4>
                <div className="h-[300px] flex flex-col bg-muted/15 rounded-lg p-1 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                  <CommentThread
                    projectId={projectId}
                    deliverableId={selectedDeliv.id}
                    comments={delivComments}
                    currentUserId={userId}
                    currentUserRole={memberRole}
                  />
                </div>
              </div>
            </DialogContent>
          );
        })()}
      </Dialog>
    </>
  );
}
