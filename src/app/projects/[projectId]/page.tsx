import { db } from "@/utils/db";
import { project, activityLog, user as userTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MarkCompleteButton } from "@/components/projects/mark-complete-button";
import { TimelineAreaChart } from "@/components/projects/timeline-area-chart";
import { ContractBanner } from "@/components/projects/contract-banner";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import {
  FileText, CheckCircle2, Clock, ArrowRight, UploadCloud,
  AlertCircle, Eye, RotateCcw, Files, MessageSquare, Activity
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  approved: { label: "Approved", color: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  in_review: { label: "In Review", color: "text-blue-600 dark:text-blue-400", icon: Eye },
  revision_requested: { label: "Revision", color: "text-red-600 dark:text-red-400", icon: RotateCcw },
  pending: { label: "Pending", color: "text-muted-foreground", icon: Clock },
};

const ACTIVITY_LABELS: Record<string, string> = {
  contract_uploaded: "uploaded a contract",
  contract_signed: "signed the contract",
  file_uploaded: "uploaded a file",
  deliverable_created: "created a deliverable",
  deliverable_approved: "approved a deliverable",
  revision_requested: "requested a revision",
  deliverable_completed: "completed a deliverable",
  project_completed: "marked the project complete",
  member_joined: "joined the project",
  deliverable_in_review: "submitted for review",
  comment_added: "added a comment",
};

function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return null;

  const { projectId } = await params;

  // Fetch Project with all necessary relations
  const proj = await db.query.project.findFirst({
    where: eq(project.id, projectId),
    with: {
      members: {
        with: {
          user: true,
        }
      },
      deliverables: {
        orderBy: (deliverables, { asc }) => [asc(deliverables.createdAt)]
      },
      files: true,
      contracts: true,
    }
  });

  if (!proj) return <div>Project not found</div>;

  // Fetch recent activity
  const recentActivity = await db
    .select({ log: activityLog, actor: userTable })
    .from(activityLog)
    .leftJoin(userTable, eq(activityLog.userId, userTable.id))
    .where(eq(activityLog.projectId, projectId))
    .orderBy(desc(activityLog.createdAt))
    .limit(5);

  const currentUserMember = proj.members.find(m => m.user.id === session.user.id);
  const isOwner = currentUserMember?.role === 'owner';

  const totalDelivs = proj.deliverables.length;
  const approvedDelivs = proj.deliverables.filter(d => d.status === 'approved').length;
  const inReviewDelivs = proj.deliverables.filter(d => d.status === 'in_review').length;
  const revisionDelivs = proj.deliverables.filter(d => d.status === 'revision_requested').length;
  const pendingDelivs = totalDelivs - approvedDelivs - inReviewDelivs - revisionDelivs;
  const completionPct = totalDelivs > 0 ? Math.round((approvedDelivs / totalDelivs) * 100) : 0;

  const canComplete = isOwner && proj.status !== 'completed' && totalDelivs > 0 && approvedDelivs === totalDelivs;
  
  const daysActive = Math.max(1, Math.round((new Date().getTime() - new Date(proj.createdAt).getTime()) / (1000 * 60 * 60 * 24)));

  // Compute Area Chart Data
  const chartData = [];
  const startDate = new Date(proj.createdAt).getTime();
  const endDate = new Date().getTime();
  const totalDuration = Math.max(endDate - startDate, 1000 * 60 * 60 * 24 * 6);
  const numPoints = 7;
  const interval = totalDuration / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const pointDate = new Date(startDate + interval * i);
    let completedAtPoint = 0;
    
    proj.deliverables.forEach(d => {
       if (d.status === 'approved' && new Date(d.updatedAt).getTime() <= pointDate.getTime()) {
         completedAtPoint++;
       }
    });

    if (i === numPoints - 1) {
      completedAtPoint = approvedDelivs;
    }

    chartData.push({
      date: pointDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      completed: completedAtPoint,
      expected: totalDelivs
    });
  }

  const activeContract = proj.contracts[0];
  const contractStatus = activeContract ? activeContract.status as "draft" | "pending_signature" | "signed" : "none";

  // SVG progress ring calculations
  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (completionPct / 100) * ringCircumference;

  return (
    <div className="w-full max-w-5xl space-y-8">
      
      <ContractBanner 
        projectId={projectId} 
        status={contractStatus} 
        role={currentUserMember?.role as "owner" | "client" | "agency"} 
      />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight" style={{ textWrap: 'balance' as any }}>{proj.name}</h1>
            <Badge
              variant="secondary"
              className={`capitalize text-[11px] font-semibold shadow-none ${
                proj.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : proj.status === 'completed'
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {proj.status}
            </Badge>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Created {new Date(proj.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            {' · '}
            <span className="tabular-nums">{daysActive}</span> days active
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Team avatars */}
          <div className="flex -space-x-2">
            {proj.members.slice(0, 4).map((member) => (
              <Avatar
                key={member.id}
                className="h-8 w-8 ring-2 ring-background shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                title={member.user.name || "Team Member"}
              >
                <AvatarImage src={member.user.image || ""} className="rounded-full outline outline-1 outline-black/[0.08] dark:outline-white/[0.08]" />
                <AvatarFallback className="bg-muted text-muted-foreground text-[11px] font-semibold">
                  {member.user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            ))}
            {proj.members.length > 4 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-2 ring-background text-[11px] font-semibold text-muted-foreground">
                +{proj.members.length - 4}
              </div>
            )}
          </div>
          {canComplete && (
            <MarkCompleteButton projectId={projectId} />
          )}
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Completion Ring */}
        <div className="rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.04)] bg-background flex items-center gap-4">
          <div className="relative shrink-0">
            <svg width="56" height="56" viewBox="0 0 96 96" className="-rotate-90">
              <circle cx="48" cy="48" r={ringRadius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/50" />
              <circle
                cx="48" cy="48" r={ringRadius} fill="none"
                stroke="currentColor" strokeWidth="6" strokeLinecap="round"
                className="text-emerald-500 transition-[stroke-dashoffset] duration-700"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold tabular-nums">
              {completionPct}%
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Completion</p>
            <p className="text-sm font-semibold tabular-nums">{approvedDelivs}<span className="text-muted-foreground font-normal">/{totalDelivs}</span></p>
          </div>
        </div>

        {/* Files */}
        <div className="rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.04)] bg-background">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10">
              <Files className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Files</span>
          </div>
          <p className="text-xl font-bold tabular-nums">{proj.files.length}</p>
        </div>

        {/* Contract */}
        <div className="rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.04)] bg-background">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10">
              <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Contract</span>
          </div>
          <p className="text-sm font-semibold capitalize">
            {contractStatus === "none" ? "Not uploaded" : contractStatus.replace("_", " ")}
          </p>
        </div>

        {/* Team */}
        <div className="rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.04)] bg-background">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10">
              <svg className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Team</span>
          </div>
          <p className="text-xl font-bold tabular-nums">{proj.members.length}</p>
        </div>
      </div>

      {/* ── Two-column: Chart + Deliverable Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Chart — spans 3 cols */}
        <div className="lg:col-span-3 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.04)] bg-background">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[13px] font-semibold text-foreground">Progress Over Time</h2>
            <Link
              href={`/projects/${projectId}/deliverables`}
              className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
            >
              Deliverables <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <p className="text-[12px] text-muted-foreground mb-3" style={{ textWrap: 'pretty' as any }}>
            Approved deliverables vs total over the project lifetime.
          </p>
          <TimelineAreaChart data={chartData} />
        </div>

        {/* Deliverable Breakdown — spans 2 cols */}
        <div className="lg:col-span-2 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.04)] bg-background flex flex-col">
          <h2 className="text-[13px] font-semibold text-foreground mb-4">Deliverable Status</h2>
          
          {totalDelivs === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center py-6">
              <div>
                <div className="mx-auto h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-[13px] text-muted-foreground">No deliverables yet</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {/* Stacked progress bar */}
              <div className="flex h-2.5 rounded-full overflow-hidden bg-muted/30">
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
                  <div className="bg-zinc-300 dark:bg-zinc-600 transition-all duration-500" style={{ width: `${(pendingDelivs / totalDelivs) * 100}%` }} />
                )}
              </div>

              {/* Breakdown rows */}
              <div className="space-y-2 pt-1">
                {([
                  { key: 'approved', count: approvedDelivs },
                  { key: 'in_review', count: inReviewDelivs },
                  { key: 'revision_requested', count: revisionDelivs },
                  { key: 'pending', count: pendingDelivs },
                ] as const).map(({ key, count }) => {
                  if (count === 0) return null;
                  const config = STATUS_CONFIG[key];
                  const Icon = config.icon;
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
        </div>
      </div>

      {/* ── Quick Links + Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Quick Links — spans 2 cols */}
        <div className="lg:col-span-2 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.04)] bg-background">
          <h2 className="text-[13px] font-semibold text-foreground mb-3">Quick Links</h2>
          <div className="space-y-1">
            {[
              { label: "Deliverables", href: `/projects/${projectId}/deliverables`, icon: CheckCircle2, desc: `${totalDelivs} total` },
              { label: "Files", href: `/projects/${projectId}/files`, icon: Files, desc: `${proj.files.length} uploaded` },
              { label: "Discussions", href: `/projects/${projectId}/discussions`, icon: MessageSquare, desc: "Team conversations" },
              { label: "Activity Log", href: `/projects/${projectId}/activity`, icon: Activity, desc: "Full history" },
            ].map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-[background-color,transform] active:scale-[0.98] group"
                >
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-[13px]">{link.label}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{link.desc}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-[color,transform] group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity — spans 3 cols */}
        <div className="lg:col-span-3 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.04)] bg-background">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold text-foreground">Recent Activity</h2>
            <Link
              href={`/projects/${projectId}/activity`}
              className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
            >
              View all <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-center">
              <div>
                <div className="mx-auto h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center mb-2">
                  <Activity className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-[13px] text-muted-foreground">No activity yet</p>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {recentActivity.map(({ log, actor }) => (
                <div key={log.id} className="flex items-start gap-3 py-2.5 border-b border-border/10 last:border-0">
                  <Avatar className="h-6 w-6 mt-0.5 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                    <AvatarImage src={actor?.image || ""} className="rounded-full outline outline-1 outline-black/[0.08] dark:outline-white/[0.08]" />
                    <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-semibold">
                      {actor?.name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-snug">
                      <span className="font-medium">{actor?.name || "Someone"}</span>
                      {' '}
                      <span className="text-muted-foreground">{ACTIVITY_LABELS[log.type] || log.type}</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums shrink-0 mt-0.5">
                    {relativeTime(new Date(log.createdAt))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
