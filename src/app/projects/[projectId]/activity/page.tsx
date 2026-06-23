import { db } from "@/utils/db";
import { activityLog, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { 
  FileText, 
  PenTool, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Flag,
  UserPlus,
  Play
} from "lucide-react";

export default async function ActivityPage({ params }: { params: Promise<{ projectId: string }> }) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return null;

  const { projectId } = await params;

  const logs = await db
    .select({
      log: activityLog,
      actor: user
    })
    .from(activityLog)
    .leftJoin(user, eq(activityLog.userId, user.id))
    .where(eq(activityLog.projectId, projectId))
    .orderBy(desc(activityLog.createdAt));

  const getActivityConfig = (type: string, metadata: Record<string, unknown>) => {
    switch (type) {
      case "contract_uploaded":
        return { icon: <FileText className="w-5 h-5 text-blue-500" />, text: `uploaded the contract (${metadata?.fileName})` };
      case "contract_signed":
        return { icon: <PenTool className="w-5 h-5 text-emerald-500" />, text: metadata?.fullySigned ? "signed the contract (fully executed)" : "signed the contract" };
      case "file_uploaded":
        return { icon: <Upload className="w-5 h-5 text-purple-500" />, text: `uploaded a file (${metadata?.fileName})` };
      case "deliverable_created":
        return { icon: <Play className="w-5 h-5 text-indigo-500" />, text: `created deliverable: ${metadata?.title}` };
      case "deliverable_in_review":
        return { icon: <AlertCircle className="w-5 h-5 text-amber-500" />, text: `submitted deliverable for review: ${metadata?.title}` };
      case "deliverable_approved":
        return { icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, text: `approved deliverable: ${metadata?.title}` };
      case "revision_requested":
        return { icon: <AlertCircle className="w-5 h-5 text-destructive" />, text: `requested a revision on: ${metadata?.title}. Reason: ${metadata?.comment}` };
      case "project_completed":
        return { icon: <Flag className="w-5 h-5 text-emerald-500" />, text: "marked the project as completed!" };
      case "member_joined":
        return { icon: <UserPlus className="w-5 h-5 text-emerald-500" />, text: `joined the project as a client` };
      default:
        return { icon: <FileText className="w-5 h-5 text-muted-foreground" />, text: "performed an action" };
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
        <p className="text-muted-foreground mt-1">A complete timeline of all actions taken in this project.</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No activity recorded yet.
            </div>
          ) : (
            <div className="relative border-l border-muted ml-3 space-y-8 pb-4">
              {logs.map(({ log, actor }) => {
                const config = getActivityConfig(log.type, log.metadata);
                
                return (
                  <div key={log.id} className="relative pl-8">
                    {/* Timeline Dot/Icon */}
                    <div className="absolute -left-3.5 top-0 bg-background rounded-full p-1 border shadow-sm">
                      {config.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex flex-col gap-1">
                      <div className="text-sm">
                        <span className="font-semibold text-foreground">{actor?.name || "Unknown User"}</span>
                        {" "}
                        <span className="text-muted-foreground">{config.text}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
