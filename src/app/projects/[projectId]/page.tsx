import { db } from "@/utils/db";
import { project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MarkCompleteButton } from "@/components/projects/mark-complete-button";
import { TimelineAreaChart } from "@/components/projects/timeline-area-chart";
import { ContractBanner } from "@/components/projects/contract-banner";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { FileText, CheckCircle2, Clock, ArrowRight, UploadCloud } from "lucide-react";

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

  const currentUserMember = proj.members.find(m => m.user.id === session.user.id);
  const isOwner = currentUserMember?.role === 'owner';

  const totalDelivs = proj.deliverables.length;
  const approvedDelivs = proj.deliverables.filter(d => d.status === 'approved').length;
  
  const canComplete = isOwner && proj.status !== 'completed' && totalDelivs > 0 && approvedDelivs === totalDelivs;
  
  const daysActive = Math.max(1, Math.round((new Date().getTime() - new Date(proj.createdAt).getTime()) / (1000 * 60 * 60 * 24)));

  // Compute Area Chart Data
  const chartData = [];
  const startDate = new Date(proj.createdAt).getTime();
  const endDate = new Date().getTime();
  const totalDuration = Math.max(endDate - startDate, 1000 * 60 * 60 * 24 * 6); // at least 6 days spread
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

  return (
    <div className="space-y-12 w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <ContractBanner 
        projectId={projectId} 
        status={contractStatus} 
        role={currentUserMember?.role as "owner" | "client" | "agency"} 
      />

      {/* Header & Inline Stats */}
      <div className="flex flex-col gap-6 border-b border-border/40 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-balance text-foreground">{proj.name}</h1>
              <Badge variant={proj.status === "active" ? "default" : "secondary"} className="capitalize">
                {proj.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Team Members */}
            <div className="flex items-center">
              <div className="flex -space-x-3">
                {proj.members.slice(0, 5).map((member) => (
                  <Avatar key={member.id} className="h-9 w-9 ring-2 ring-background border border-border/40 shadow-sm transition-transform hover:-translate-y-1 hover:z-10 cursor-pointer" title={member.user.name || "Team Member"}>
                    <AvatarImage src={member.user.image || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{member.user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {proj.members.length > 5 && (
                <div className="ml-2 text-sm text-muted-foreground font-medium">+{proj.members.length - 5}</div>
              )}
            </div>
            
            {canComplete && (
              <MarkCompleteButton projectId={projectId} />
            )}
          </div>
        </div>

        {/* Inline Stats Strip */}
        <div className="flex flex-wrap items-center gap-x-12 gap-y-6 text-sm mt-4">
          <div className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Deliverables</span>
              <span className="font-bold tabular-nums text-foreground text-lg">{totalDelivs} Total</span>
            </div>
          </div>
          <div className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Approved</span>
              <span className="font-bold tabular-nums text-foreground text-lg">{approvedDelivs}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors shadow-sm">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Files</span>
              <span className="font-bold tabular-nums text-foreground text-lg">{proj.files.length} Uploaded</span>
            </div>
          </div>
          <div className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors shadow-sm">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Timeline</span>
              <span className="font-bold tabular-nums text-foreground text-lg">{daysActive} Days Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {/* Progress Section (Full Width) */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight">Timeline & Progress</h2>
          <div className="rounded-2xl bg-muted/5 p-6 md:p-8 border border-border/40 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground text-lg">Overall Completion</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mt-1">
                  {approvedDelivs} out of {totalDelivs} deliverables have been approved by the client. Once all deliverables are approved, the project can be marked as complete.
                </p>
              </div>
            </div>
            <TimelineAreaChart data={chartData} />
          </div>
        </section>

        {/* Timeline Section (Full Width) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Milestone Timeline</h2>
            <Link href={`/projects/${projectId}/deliverables`} className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1 group">
              Manage Deliverables <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          <div className="rounded-2xl border border-border/40 p-6 md:p-8 bg-card shadow-sm transition-shadow hover:shadow-md">
            {proj.deliverables.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">No deliverables planned yet.</p>
                <p className="text-sm mt-2 opacity-80">Add deliverables to track milestone progress over time.</p>
              </div>
            ) : (
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {proj.deliverables.map((d) => (
                  <div key={d.id} className="relative flex flex-col md:flex-row items-start md:items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    
                    {/* Timeline Dot */}
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-4 border-background shrink-0 mt-3 md:mt-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${d.status === 'approved' ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                    </div>
                    
                    {/* Card Content */}
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-5 rounded-xl border border-border/40 bg-background shadow-sm hover:shadow-md transition-all group-hover:border-primary/30 ml-12 md:ml-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="font-semibold text-base text-foreground leading-tight">{d.title}</h4>
                        <Badge variant={d.status === 'approved' ? 'default' : 'secondary'} className="text-xs uppercase tracking-wider shrink-0 font-semibold shadow-sm">
                          {d.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {d.dueDate && (
                        <p className="text-sm text-muted-foreground font-medium">Due: {new Date(d.dueDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
