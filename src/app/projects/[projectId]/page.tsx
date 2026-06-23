import { db } from "@/utils/db";
import { project, deliverable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MarkCompleteButton } from "./mark-complete-button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { FileText, CheckCircle2, Clock, Activity, ArrowRight, UploadCloud, FileSignature, MessageSquare, PlusCircle } from "lucide-react";

function getRelativeTime(date: Date) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const daysDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDifference === 0) {
    const hoursDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60));
    if (hoursDifference === 0) {
      const minutesDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60));
      return rtf.format(minutesDifference, 'minute');
    }
    return rtf.format(hoursDifference, 'hour');
  }
  return rtf.format(daysDifference, 'day');
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'contract_uploaded':
    case 'contract_signed':
      return <FileSignature className="h-4 w-4" />;
    case 'file_uploaded':
      return <UploadCloud className="h-4 w-4" />;
    case 'deliverable_created':
    case 'deliverable_completed':
    case 'project_completed':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'revision_requested':
      return <MessageSquare className="h-4 w-4" />;
    case 'member_joined':
      return <PlusCircle className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
}

function formatActivityText(log: any) {
  const type = log.type;
  switch (type) {
    case 'contract_uploaded': return 'Contract uploaded';
    case 'contract_signed': return 'Contract signed';
    case 'file_uploaded': return 'File uploaded';
    case 'deliverable_created': return 'Deliverable created';
    case 'deliverable_approved': return 'Deliverable approved';
    case 'revision_requested': return 'Revision requested';
    case 'deliverable_completed': return 'Deliverable completed';
    case 'project_completed': return 'Project completed';
    case 'member_joined': return 'Team member joined';
    case 'deliverable_in_review': return 'Deliverable in review';
    default: return type;
  }
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
      contracts: true,
      members: {
        with: {
          user: true,
        }
      },
      deliverables: {
        orderBy: (deliverables, { asc }) => [asc(deliverables.createdAt)]
      },
      files: true,
      activityLogs: {
        orderBy: (activityLogs, { desc }) => [desc(activityLogs.createdAt)],
        limit: 5,
        with: {
          user: true,
        }
      }
    }
  });

  if (!proj) return <div>Project not found</div>;

  const currentUserMember = proj.members.find(m => m.user.id === session.user.id);
  const isOwner = currentUserMember?.role === 'owner';

  const totalDelivs = proj.deliverables.length;
  const approvedDelivs = proj.deliverables.filter(d => d.status === 'approved').length;
  const progressVal = totalDelivs === 0 ? 0 : Math.round((approvedDelivs / totalDelivs) * 100);
  
  const canComplete = isOwner && proj.status !== 'completed' && totalDelivs > 0 && approvedDelivs === totalDelivs;
  
  const daysActive = Math.max(1, Math.round((new Date().getTime() - new Date(proj.createdAt).getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{proj.name}</h1>
            <Badge variant={proj.status === "active" ? "default" : "secondary"} className="capitalize">
              {proj.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            Project Overview and Details
          </p>
        </div>
        {canComplete && (
          <MarkCompleteButton projectId={projectId} />
        )}
      </div>

      {/* Top Stat Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deliverables</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDelivs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedDelivs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Files</CardTitle>
            <UploadCloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proj.files.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Days Active</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysActive}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Deliverable Progress & Timeline (Left 2 columns) */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deliverable Progress</CardTitle>
              <CardDescription>Overall completion status for this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">Progress</span>
                <span className="font-bold">{progressVal}%</span>
              </div>
              <Progress value={progressVal} className="h-3" />
              <div className="text-sm text-muted-foreground mt-2">
                {approvedDelivs} of {totalDelivs} deliverables approved
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Milestone Timeline</CardTitle>
              <CardDescription>Chronological list of deliverables</CardDescription>
            </CardHeader>
            <CardContent>
              {proj.deliverables.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground italic bg-muted/20 rounded-lg border border-dashed">
                  No deliverables created yet
                </div>
              ) : (
                <div className="space-y-6 border-l-2 border-muted ml-3 pl-6 relative">
                  {proj.deliverables.map((d, i) => (
                    <div key={d.id} className="relative">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-background ${d.status === 'approved' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-sm">{d.title}</h4>
                          {d.dueDate && (
                            <p className="text-xs text-muted-foreground mt-1">Due: {new Date(d.dueDate).toLocaleDateString()}</p>
                          )}
                        </div>
                        <Badge variant={d.status === 'approved' ? 'default' : 'secondary'} className="w-fit capitalize">
                          {d.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activity & Team */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle>Recent Activity</CardTitle>
              </div>
              <Link href={`/projects/${projectId}/activity`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {proj.activityLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No activity yet.</p>
              ) : (
                <div className="space-y-4 mt-2">
                  {proj.activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-md p-1.5 bg-muted text-muted-foreground">
                        {getActivityIcon(log.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {formatActivityText(log)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.user?.name || "Someone"} • {getRelativeTime(new Date(log.createdAt))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proj.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.image || ""} />
                      <AvatarFallback>{member.user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">{member.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
