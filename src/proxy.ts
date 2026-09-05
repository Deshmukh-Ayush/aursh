import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/utils/db"; // Ensure this is Edge-compatible (e.g., Drizzle HTTP / Neon serverless)
import { member, projectMember, project, organization } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const protectedPaths = ["/onboarding", "/dashboard", "/projects"];

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const isSignIn = pathname === "/sign-in";
    const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

    if (!isSignIn && !isProtected) {
      return NextResponse.next();
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      if (isProtected) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }
      return NextResponse.next();
    }

    if (isSignIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Redirect bare /projects to dashboard projects
    if (pathname === "/projects" || pathname === "/projects/") {
      return NextResponse.redirect(new URL("/dashboard/projects", request.url));
    }

    // --- Pass resolved identity to render via request headers ---
    // IMPORTANT: strip any client-supplied versions of these headers FIRST,
    // before setting our own resolved values — otherwise a client can spoof
    // their own org/user/role/project permissions via request headers.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete("x-user-id");
    requestHeaders.delete("x-user-name");
    requestHeaders.delete("x-user-email");
    requestHeaders.delete("x-user-image");
    requestHeaders.delete("x-org-id");
    requestHeaders.delete("x-org-role");
    requestHeaders.delete("x-org-plan");
    requestHeaders.delete("x-org-name");
    requestHeaders.delete("x-org-logo-url");
    requestHeaders.delete("x-project-id");
    requestHeaders.delete("x-project-role");
    requestHeaders.delete("x-project-authorized");
    requestHeaders.delete("x-project-name");
    requestHeaders.delete("x-project-org-id");

    requestHeaders.set("x-user-id", session.user.id);
    requestHeaders.set("x-user-name", session.user.name || "");
    requestHeaders.set("x-user-email", session.user.email || "");
    requestHeaders.set("x-user-image", session.user.image || "");

    // Set org id from the session's active organization (available without an extra query)
    const activeOrgId = session.session?.activeOrganizationId || "";
    if (activeOrgId) {
      requestHeaders.set("x-org-id", activeOrgId);
    }

    // --- STRICT CLIENT SAFEGUARD ---
    // If they are trying to access /dashboard, verify they are an agency user
    if (pathname.startsWith("/dashboard")) {
      const userId = session.user.id;

      // Concurrently check org membership and client project membership
      const [orgMemberships, clientProjectMemberships] = await Promise.all([
        db.select({ role: member.role, organizationId: member.organizationId }).from(member).where(eq(member.userId, userId)),
        db.select({ projectId: projectMember.projectId }).from(projectMember).where(
          and(eq(projectMember.userId, userId), eq(projectMember.role, "client"))
        ),
      ]);

      const isAgencyUser = orgMemberships.some(
        (m) => m.role === "owner" || m.role === "member" || m.role === "admin" || m.role === "agency"
      );

      // If they are strictly a client, they cannot see /dashboard
      if (!isAgencyUser) {
        if (clientProjectMemberships.length > 0) {
          // Redirect them to their first client project
          return NextResponse.redirect(
            new URL(`/projects/${clientProjectMemberships[0].projectId}`, request.url)
          );
        } else {
          // Unassigned client
          return NextResponse.redirect(new URL("/sign-in", request.url));
        }
      }

      // Set org role from the membership matching the active org
      const activeMembership = activeOrgId
        ? orgMemberships.find((m) => m.organizationId === activeOrgId)
        : undefined;
      if (activeMembership) {
        requestHeaders.set("x-org-role", activeMembership.role);
      }
    }

    // --- PROJECT AUTHORIZATION & RESOLUTION ---
    if (pathname.startsWith("/projects/")) {
      const segments = pathname.split("/").filter(Boolean);
      const projectId = segments[1];

      if (projectId) {
        const userId = session.user.id;

        // Concurrently query project existence and direct project membership
        const [[proj], [pm]] = await Promise.all([
          db
            .select({
              id: project.id,
              name: project.name,
              organizationId: project.organizationId,
            })
            .from(project)
            .where(eq(project.id, projectId)),
          db
            .select({ role: projectMember.role })
            .from(projectMember)
            .where(
              and(
                eq(projectMember.projectId, projectId),
                eq(projectMember.userId, userId)
              )
            ),
        ]);

        if (!proj) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        let role: "owner" | "agency" | "client" | null = pm ? (pm.role as any) : null;
        let orgData: { id: string; name: string; plan: string; logoUrl: string | null } | undefined;

        if (proj.organizationId) {
          if (!role) {
            // Check organization membership for fallback access
            const [[orgMem], [orgRecord]] = await Promise.all([
              db
                .select({ role: member.role })
                .from(member)
                .where(
                  and(
                    eq(member.organizationId, proj.organizationId),
                    eq(member.userId, userId)
                  )
                ),
              db
                .select({
                  id: organization.id,
                  name: organization.name,
                  plan: organization.plan,
                  logoUrl: organization.logoUrl,
                })
                .from(organization)
                .where(eq(organization.id, proj.organizationId)),
            ]);
            if (orgMem) {
              role = orgMem.role === "owner" ? "owner" : "agency";
            }
            orgData = orgRecord;
          } else {
            const [orgRecord] = await db
              .select({
                id: organization.id,
                name: organization.name,
                plan: organization.plan,
                logoUrl: organization.logoUrl,
              })
              .from(organization)
              .where(eq(organization.id, proj.organizationId));
            orgData = orgRecord;
          }
        }

        // If not authorized to this project, redirect before React renders anything
        if (!role) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        // Set verified project headers
        requestHeaders.set("x-project-id", proj.id);
        requestHeaders.set("x-project-role", role);
        requestHeaders.set("x-project-name", encodeURIComponent(proj.name));
        if (proj.organizationId) {
          requestHeaders.set("x-project-org-id", proj.organizationId);
        }

        if (orgData) {
          requestHeaders.set("x-org-id", orgData.id);
          requestHeaders.set("x-org-plan", orgData.plan);
          requestHeaders.set("x-org-name", encodeURIComponent(orgData.name));
          if (orgData.logoUrl) {
            requestHeaders.set("x-org-logo-url", orgData.logoUrl);
          }
        }
      }
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch (err) {
    console.error("proxy middleware error:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/sign-in",
    "/onboarding",
    "/dashboard",
    "/dashboard/:path*",
    "/projects/:path*",
  ],
};
