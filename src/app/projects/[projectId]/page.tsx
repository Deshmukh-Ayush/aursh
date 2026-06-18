import { db } from "@/utils/db";
import { project, projectMember, contract, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  // Fetch Project
  const [proj] = await db.select().from(project).where(eq(project.id, projectId));
  
  // Fetch Contract
  const [cont] = await db.select().from(contract).where(eq(contract.projectId, projectId));

  // Fetch Members
  const members = await db
    .select({
      member: projectMember,
      user: user,
    })
    .from(projectMember)
    .innerJoin(user, eq(projectMember.userId, user.id))
    .where(eq(projectMember.projectId, projectId));

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{proj.name}</h1>
        <p className="text-muted-foreground mt-2">
          Project Overview and Details
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={proj.status === "active" ? "default" : "secondary"} className="capitalize">{proj.status}</Badge>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground">Created Date</span>
              <span className="font-medium">{new Date(proj.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-muted-foreground">Contract Status</span>
              <Badge variant={cont?.status === "signed" ? "default" : "outline"} className="capitalize">
                {cont?.status || "Draft"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map(({ member, user }) => (
                <div key={member.id} className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback>{user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant={member.role === "owner" ? "default" : "secondary"} className="capitalize">
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
