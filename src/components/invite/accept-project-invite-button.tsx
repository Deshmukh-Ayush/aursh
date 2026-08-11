"use client"

import * as React from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, ArrowRight } from "lucide-react"

interface AcceptProjectInviteButtonProps {
  needsLogin: boolean
  inviteId?: string
  projectId?: string
  overrideText?: string
}

export function AcceptProjectInviteButton({
  needsLogin,
  inviteId,
  projectId,
  overrideText,
}: AcceptProjectInviteButtonProps) {
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  const targetUrl = projectId ? `/projects/${projectId}` : "/dashboard"

  const handleSignInWithGoogle = async () => {
    setLoading(true)
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: targetUrl,
      })
    } catch {
      toast.error("Failed to initiate Google sign in.")
      setLoading(false)
    }
  }

  const handleAcceptInvite = async () => {
    if (!inviteId) return
    setLoading(true)
    try {
      const res = await fetch("/api/projects/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to accept invitation.")
        setLoading(false)
        return
      }

      toast.success("Invitation accepted!")
      router.push(`/projects/${data.projectId || projectId || ""}`)
    } catch {
      toast.error("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  if (needsLogin) {
    return (
      <Button
        onClick={handleSignInWithGoogle}
        disabled={loading}
        className="w-full rounded-full bg-brand text-white font-semibold hover:bg-brand-hover active:scale-[0.96] transition-transform h-10 text-sm shadow-xs flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <span>{overrideText || "Sign in with Google to view project"}</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    )
  }

  return (
    <Button
      onClick={handleAcceptInvite}
      disabled={loading}
      className="w-full rounded-full bg-brand text-white font-semibold hover:bg-brand-hover active:scale-[0.96] transition-transform h-10 text-sm shadow-xs flex items-center justify-center gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <span>{overrideText || "Accept invitation & view project"}</span>
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  )
}
