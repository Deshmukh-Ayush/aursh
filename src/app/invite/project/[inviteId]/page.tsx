import React from "react"
import { db } from "@/utils/db"
import { projectInvitation, project, organization } from "@/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { AcceptProjectInviteButton } from "@/components/invite/accept-project-invite-button"

export const metadata: Metadata = {
  title: "Project Invitation",
  description: "You have been invited to collaborate on a project.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function ProjectInvitePage({
  params,
}: {
  params: Promise<{ inviteId: string }>
}) {
  const resolvedParams = await params
  const inviteId = resolvedParams.inviteId

  // Concurrently fetch invitation + project + org (Promise.all)
  const [invitationResult] = await db
    .select({
      inv: projectInvitation,
      proj: project,
      org: organization,
    })
    .from(projectInvitation)
    .innerJoin(project, eq(project.id, projectInvitation.projectId))
    .innerJoin(organization, eq(organization.id, project.organizationId))
    .where(eq(projectInvitation.id, inviteId))

  if (!invitationResult) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-muted/20">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>
              This project invitation link does not exist or has been removed.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const { inv, proj, org } = invitationResult

  if (inv.status === "accepted") {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-muted/20">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Already Accepted</CardTitle>
            <CardDescription>
              You have already accepted the invitation to <strong>{proj.name}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/projects/${proj.id}`}
              className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-brand-hover"
            >
              Open Project Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (new Date(inv.expiresAt) < new Date()) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-muted/20">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Link Expired</CardTitle>
            <CardDescription>
              This project invitation link has expired. Please ask the agency to re-send your invite.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-md space-y-6">
        {/* Agency Logo Header */}
        <div className="flex flex-col items-center justify-center text-center gap-2">
          {org.logoUrl ? (
            <div className="relative h-12 w-32">
              <Image
                src={org.logoUrl}
                alt={org.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <span className="text-lg font-bold tracking-tight text-foreground">
              {org.name}
            </span>
          )}
        </div>

        <Card className="border border-border/40 shadow-lg bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              Collaborate on {proj.name}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              <strong>{org.name}</strong> invited you to view project deliverables, review contracts, and communicate directly.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {!session ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground text-center border border-border/40">
                  Sign in with your Google account to access your project dashboard.
                </div>
                <AcceptProjectInviteButton
                  needsLogin={true}
                  projectId={proj.id}
                />
              </div>
            ) : session.user.email.toLowerCase() === inv.email.toLowerCase() ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  Signed in as <strong>{session.user.email}</strong>. Click below to accept and enter the project.
                </div>
                <AcceptProjectInviteButton
                  needsLogin={false}
                  inviteId={inviteId}
                  projectId={proj.id}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-destructive/10 p-4 text-xs text-destructive border border-destructive/20 text-center">
                  Signed in as <strong>{session.user.email}</strong>, but this invite was sent to <strong>{inv.email}</strong>.
                </div>
                <AcceptProjectInviteButton
                  needsLogin={true}
                  overrideText="Sign in with correct account"
                  projectId={proj.id}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
