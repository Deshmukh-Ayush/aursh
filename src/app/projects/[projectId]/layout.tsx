import { db } from "@/utils/db";
import { project, projectMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

// According to Next.js 15+ App Router, params in async layout must be awaited.
export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const userId = session.user.id;
  const resolvedParams = await params;
  const projectId = resolvedParams.projectId;

  // Verify access
  const member = await db.select().from(projectMember).where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));

  if (member.length === 0) {
    return <div className="p-8 text-center text-destructive">You do not have access to this project.</div>;
  }

  const proj = await db.select().from(project).where(eq(project.id, projectId));

  return (
    <div className="flex flex-col min-h-svh bg-muted/10">
      <header className="border-b bg-background">
        <div className="flex items-center justify-between p-4 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium hover:underline text-muted-foreground">
              ← Dashboard
            </Link>
            <h1 className="text-xl font-bold">{proj[0]?.name}</h1>
            <span className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground capitalize">
              Role: {member[0].role}
            </span>
          </div>
          <SignOutButton />
        </div>
        <div className="max-w-6xl mx-auto w-full px-4 flex gap-6">
          <Link href={`/projects/${projectId}/contract`} className="border-b-2 border-primary py-3 text-sm font-medium">
            Contract
          </Link>
          <div className="py-3 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed">Files</div>
          <div className="py-3 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed">Deliverables</div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
