import { auth } from "@/lib/auth";
import { db } from "@/utils/db";
import { workspace, organization, member } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export interface WorkspaceContextResult {
  session: any;
  user: any;
  organizationId: string;
  workspaceId?: string;
  memberRole?: "owner" | "agency" | "client" | string;
  error?: string;
  status?: number;
}

/**
 * Deep module that resolves session, organization, workspace, and member role in one unified call.
 * Eliminates duplicate session/org fallback boilerplate across API routes and Server Components.
 */
export async function getTenantContext(
  reqHeaders?: Headers,
  targetWorkspaceId?: string
): Promise<WorkspaceContextResult> {
  const reqH = reqHeaders || (await headers());
  const session = await auth.api.getSession({ headers: reqH });

  if (!session || !session.user) {
    return { session: null, user: null, organizationId: "", error: "Unauthorized", status: 401 };
  }

  let organizationId = session.session?.activeOrganizationId;

  // If workspaceId is provided, resolve organization directly from the workspace
  if (targetWorkspaceId) {
    const [foundWs] = await db
      .select({ orgId: workspace.organizationId })
      .from(workspace)
      .where(eq(workspace.id, targetWorkspaceId));

    if (foundWs) {
      organizationId = foundWs.orgId;
    }
  }

  // Fallback: list user's organizations if activeOrganizationId is not set on session
  if (!organizationId) {
    const orgs = await auth.api.listOrganizations({ headers: reqH });
    if (orgs && orgs.length > 0) {
      organizationId = orgs[0].id;
    }
  }

  if (!organizationId) {
    return {
      session,
      user: session.user,
      organizationId: "",
      error: "No active organization found",
      status: 400,
    };
  }

  // Look up user's membership role in the organization
  const [orgMember] = await db
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, organizationId), eq(member.userId, session.user.id)));

  return {
    session,
    user: session.user,
    organizationId,
    workspaceId: targetWorkspaceId,
    memberRole: orgMember?.role,
  };
}
