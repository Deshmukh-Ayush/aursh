import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { auth } from "@/lib/auth"

/**
 * React.cache()-wrapped session resolver for project pages.
 * Proxy middleware guarantees a session exists on /projects/* routes,
 * so this is safe to use without redundant null-check redirects in every page.
 * The cache ensures only ONE getSession() call per request, shared across
 * layout.tsx and all page.tsx components.
 */
export const getCachedSession = cache(async () => {
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session || !session.user) {
    redirect("/sign-in")
  }

  return session
})
