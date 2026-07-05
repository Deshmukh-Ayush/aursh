import { db } from "@/utils/db";
import { project, projectMember, contract, organization } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProjectSidebar } from "@/components/project-sidebar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MobileHeader } from "./mobile-header";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const [proj] = await db.select().from(project).where(eq(project.id, projectId));
  if (!proj) {
    redirect("/dashboard");
  }

  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, proj.organizationId));

  // Verify membership (Explicit or Implicit)
  let role: "agency" | "client" | "owner" | null = null;
  const [member] = await db
    .select()
    .from(projectMember)
    .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, session.user.id)));

  if (member) {
    role = member.role as "agency" | "client" | "owner";
  } else if (session.session?.activeOrganizationId === proj.organizationId) {
    role = "agency";
  }

  if (!role) {
    redirect("/dashboard");
  }

  // Get contract status
  const [cont] = await db.select().from(contract).where(eq(contract.projectId, projectId));

  const isSigned = cont?.status === "signed";

  return (
    <div 
      className="flex min-h-svh w-full flex-col md:flex-row"
      style={org?.plan === 'paid' && org?.brandColor ? { '--primary': org.brandColor } as React.CSSProperties : undefined}
    >
      {/* Custom Sidebar Navigation */}
      <ProjectSidebar 
        projectId={projectId} 
        projectName={proj.name} 
        role={role} 
        org={org}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <MobileHeader 
          projectId={projectId} 
          projectName={proj.name} 
          role={role} 
          org={org}
        />
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
