import { db } from "@/utils/db";
import { organization, contract } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProjectSidebar } from "@/components/sidebar/index";
import { MobileHeader } from "./mobile-header";
import { getProjectAccess } from "@/lib/project-auth";

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

  // Use unified Project Authorization resolver (solves activeOrganizationId session cookie mismatch)
  const { proj, role, isAuthorized } = await getProjectAccess(projectId, session.user.id);

  if (!isAuthorized || !proj || !role) {
    redirect("/dashboard");
  }

  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, proj.organizationId as string));

  // Get contract status
  const [cont] = await db.select().from(contract).where(eq(contract.projectId, projectId));
  const isSigned = cont?.status === "signed";

  const orgSafe = org
    ? ({ ...org, logoUrl: org.logoUrl ?? undefined, plan: org.plan } as typeof org & { logoUrl?: string, plan: string })
    : undefined;

  return (
    <div className="flex min-h-svh w-full flex-col md:flex-row dark:bg-neutral-950 bg-gray-50">
      {/* Custom Sidebar Navigation */}
      <ProjectSidebar projectId={projectId} projectName={proj.name} org={orgSafe} />
      <main className="flex-1 flex flex-col min-w-0">
        <MobileHeader projectId={projectId} projectName={proj.name} role={role} org={orgSafe} />
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
