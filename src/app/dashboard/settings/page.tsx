import { db } from "@/utils/db"
import { eq, and } from "drizzle-orm"
import { organization, member, user } from "@/db/schema"
import { getCachedTenant } from "@/utils/cached-tenant"
import { SettingsClientContainer } from "@/components/dashboard/settings/settings-client-container"

export default async function SettingsPage() {
  const { user: currentUser, organizationId } = await getCachedTenant()

  if (!organizationId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-2xl mx-auto mt-12 border rounded-xl bg-muted/20">
        <h2 className="text-xl font-semibold text-foreground">No Active Organization</h2>
        <p className="text-muted-foreground text-xs mt-2">
          You need an active organization to view settings.
        </p>
      </div>
    )
  }

  // Execute database queries concurrently using findFirst for single records
  const [org, orgMember, orgMembers] = await Promise.all([
    db.query.organization.findFirst({
      where: eq(organization.id, organizationId)
    }),
    db.query.member.findFirst({
      where: and(eq(member.organizationId, organizationId), eq(member.userId, currentUser.id))
    }),
    db
      .select({
        id: member.id,
        role: member.role,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, organizationId)),
  ])

  if (!org) {
    return <div className="p-6 text-xs text-muted-foreground">Organization not found</div>
  }

  if (!orgMember || orgMember.role !== "owner") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-2xl mx-auto mt-12 border rounded-xl bg-muted/20">
        <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground text-xs mt-2">
          Only organization owners can access settings.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings & Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your user profile, agency team, white-label branding, billing subscription, and notifications.
        </p>
      </div>

      <SettingsClientContainer
        user={{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          image: currentUser.image ?? null,
        }}
        org={{
          id: org.id,
          name: org.name,
          logoUrl: org.logoUrl,
          plan: org.plan,
        }}
        orgMembers={orgMembers}
      />
    </div>
  )
}