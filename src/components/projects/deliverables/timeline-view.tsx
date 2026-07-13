"use client";

import { useMemo, useState, useEffect } from "react";
import { format, differenceInDays, addDays, isPast, isBefore, isAfter } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CommentThread } from "@/components/projects/discussions/comment-thread";
import { Calendar, Clock, CheckCircle2, Eye, AlertCircle, Hourglass } from "lucide-react";
import { DeliverableActions } from "./deliverable-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TimelineBar } from "./timeline-bar";

const STATUS_CONFIG: Record<string, { label: string; bg: string; bar: string; text: string; icon: typeof CheckCircle2 }> = {
  approved: { label: "Approved", bg: "bg-emerald-500/8", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  in_review: { label: "In Review", bg: "bg-blue-500/8", bar: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", icon: Eye },
  revision_requested: { label: "Revision", bg: "bg-red-500/8", bar: "bg-red-500", text: "text-red-600 dark:text-red-400", icon: AlertCircle },
  pending: { label: "Pending", bg: "bg-zinc-500/8", bar: "bg-zinc-400 dark:bg-zinc-500", text: "text-muted-foreground", icon: Hourglass },
};

export function TimelineView({
  deliverables: initialDeliverables,
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
  const [items, setItems] = useState(initialDeliverables);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedDeliv, setSelectedDeliv] = useState<any | null>(null);
  const router = useRouter();

  // Reset local state if initial data changes and we're not dirty
  useEffect(() => {
    if (!isDirty) {
      setItems(initialDeliverables);
    }
  }, [initialDeliverables, isDirty]);

  const { startDate, endDate, totalDays, gridDates, todayPct } = useMemo(() => {
    if (items.length === 0) {
      const s = new Date();
      const e = addDays(s, 14);
      return { startDate: s, endDate: e, totalDays: 14, gridDates: [], todayPct: 50 };
    }

    let minDate = new Date();
    let maxDate = new Date();

    items.forEach(d => {
      const created = new Date(d.createdAt);
      const due = d.dueDate ? new Date(d.dueDate) : addDays(created, 7);
      if (isBefore(created, minDate)) minDate = created;
      if (isAfter(due, maxDate)) maxDate = due;
      if (isAfter(created, maxDate)) maxDate = created;
    });

    minDate = addDays(minDate, -3);
    maxDate = addDays(maxDate, 14);

    const total = Math.max(7, differenceInDays(maxDate, minDate));
    const step = Math.max(1, Math.floor(total / 6));
    const dates = [];
    for (let i = 0; i <= total; i += step) {
      dates.push(addDays(minDate, i));
    }

    const today = new Date();
    const tPct = Math.max(0, Math.min(100, (differenceInDays(today, minDate) / total) * 100));

    return { startDate: minDate, endDate: maxDate, totalDays: total, gridDates: dates, todayPct: tPct };
  }, [items]);

  const handleUpdateDates = (id: string, deltaDays: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const created = new Date(item.createdAt);
        const due = item.dueDate ? new Date(item.dueDate) : addDays(created, 7);
        // We shift both createdAt and dueDate for visual timeline editing consistency
        // Wait, editing createdAt is not allowed in DB typically, so we only update dueDate.
        // We can just add deltaDays to dueDate.
        const newDue = addDays(due, deltaDays);
        return { ...item, dueDate: newDue.toISOString() };
      }
      return item;
    }));
    setIsDirty(true);
  };

  const handleSaveBulk = async () => {
    setIsSaving(true);
    try {
      const updates = items.filter(item => {
        const initial = initialDeliverables.find((i: any) => i.id === item.id);
        return !initial || initial.dueDate !== item.dueDate;
      }).map(item => ({
        id: item.id,
        dueDate: item.dueDate
      }));

      if (updates.length > 0) {
        const res = await axios.patch('/api/deliverables/bulk', { updates });
        if (res.data.success) {
          toast.success("Timeline saved successfully");
          setIsDirty(false);
          router.refresh();
        }
      } else {
        setIsDirty(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save timeline");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBulk = () => {
    setItems(initialDeliverables);
    setIsDirty(false);
  };

  if (items.length === 0) {
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
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background/95 backdrop-blur-md border shadow-lg px-4 py-3 rounded-full animate-in slide-in-from-bottom-5">
           <span className="text-sm font-medium px-2">Unsaved changes</span>
           <Button variant="outline" size="sm" onClick={handleCancelBulk} disabled={isSaving} className="rounded-full">Cancel</Button>
           <Button size="sm" onClick={handleSaveBulk} disabled={isSaving} className="rounded-full">{isSaving ? "Saving..." : "Save Changes"}</Button>
        </div>
      )}

      {/* Timeline Container */}
      <div className="rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.04)] bg-background relative">
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

                {todayPct >= 0 && todayPct <= 100 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary/30"
                    style={{
                      left: `${todayPct}%`,
                      backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 4px, hsl(var(--primary) / 0.3) 4px, hsl(var(--primary) / 0.3) 8px)',
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
              {items.map((deliv, index) => (
                <TimelineBar
                  key={deliv.id}
                  deliv={deliv}
                  index={index}
                  startDate={startDate}
                  totalDays={totalDays}
                  commentsCount={allComments.filter(c => c.comment.deliverableId === deliv.id).length}
                  canEdit={memberRole === 'owner'}
                  onClick={() => setSelectedDeliv(deliv)}
                  onUpdateDates={handleUpdateDates}
                />
              ))}
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
