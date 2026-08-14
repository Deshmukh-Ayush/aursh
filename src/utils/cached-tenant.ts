import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { getTenantContext } from "@/lib/tenant-context"

export const getCachedTenant = cache(async () => {
  const reqHeaders = await headers()
  const ctx = await getTenantContext(reqHeaders)

  if (ctx.error || !ctx.user) {
    redirect("/sign-in")
  }

  return {
    user: ctx.user,
    organizationId: ctx.organizationId,
  }
})