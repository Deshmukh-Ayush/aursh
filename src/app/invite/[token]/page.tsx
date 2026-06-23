import React from 'react'
import { db } from "@/utils/db";
import { projectInvitation, project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AcceptInviteButton } from "@/components/invite/accept-invite-button";
import Link from "next/link";


export default async function InvitePage ({ params }: { params: Promise<{ token: string }> }) {
const resolvedParams = await params;
  const token = resolvedParams.token;

  const invitationResult = await db
    .select({
      inv: projectInvitation,
      proj: project
    })
    .from(projectInvitation)
    .innerJoin(project, eq(project.id, projectInvitation.projectId))
    .where(eq(projectInvitation.token, token));

  if (!invitationResult || invitationResult.length === 0) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-muted/20">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>This invitation link does not exist or has been removed.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { inv, proj } = invitationResult[0];

  if (inv.status === "accepted") {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-muted/20">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Already Accepted</CardTitle>
            <CardDescription>You have already accepted the invitation to <strong>{proj.name}</strong>.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard" className="text-primary hover:underline font-medium">Go to Dashboard</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (new Date(inv.expiresAt) < new Date()) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-muted/20">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Link Expired</CardTitle>
            <CardDescription>This invitation link has expired. Please request a new one.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-muted/20">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Accept Invitation</CardTitle>
            <CardDescription>You&apos;ve been invited to join <strong>{proj.name}</strong>.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-muted p-4 mb-4 text-sm">
              Please sign in to accept this invitation.
            </div>
            <AcceptInviteButton needsLogin={true} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-muted/20">
      <Card className="max-w-md w-full border-t-4 border-t-primary shadow-lg">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>You&apos;ve been invited to join <strong>{proj.name}</strong>.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 mb-6 text-sm flex flex-col gap-3 border">
            <div>
              <span className="text-muted-foreground block text-xs">Signed in as</span>
              <span className="font-medium">{session.user.email}</span>
            </div>
            {session.user.email !== inv.email && (
              <div className="rounded-md bg-destructive/15 text-destructive p-3 text-xs font-medium">
                Email mismatch! This invitation was sent to <strong>{inv.email}</strong>. 
                You cannot accept it with your current account.
              </div>
            )}
          </div>
          
          {session.user.email === inv.email ? (
            <AcceptInviteButton needsLogin={false} token={token} />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Please sign out and sign back in using the Google account for {inv.email}.
              </p>
              <AcceptInviteButton needsLogin={true} overrideText="Sign in with correct account" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
