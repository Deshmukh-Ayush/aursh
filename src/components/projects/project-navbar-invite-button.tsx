"use client"

import * as React from "react"
import { UserPlus, Copy, Check, Send } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ProjectNavbarInviteButtonProps {
  projectId: string
  projectName: string
  existingInviteId?: string
}

export function ProjectNavbarInviteButton({
  projectId,
  projectName,
  existingInviteId,
}: ProjectNavbarInviteButtonProps) {
  const [copied, setCopied] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  // Fallback or generated invite link
  const inviteId = existingInviteId || projectId
  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/invite/project/${inviteId}`
    : `/invite/project/${inviteId}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast.success("Client invitation link copied to clipboard!")
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  const handleSendEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/projects/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, email, role: "client" }),
      })

      if (res.ok) {
        toast.success(`Invitation sent to ${email}`)
        setEmail("")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to send invitation")
      }
    } catch {
      toast.error("Network error while sending invitation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-transform hover:bg-brand-hover active:scale-[0.96]">
          <UserPlus className="h-3.5 w-3.5" />
          <span>Invite Client</span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Invite Client to Project</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Share the white-labeled project invite link or send an email invitation for &quot;{projectName}&quot;.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-2">
          {/* Copy Link Section */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-foreground">Project Invite Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="h-9 w-full rounded-md border border-input bg-muted/50 px-3 text-xs font-mono text-muted-foreground select-all focus-visible:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-brand px-3 text-xs font-semibold text-white shadow-xs transition-transform hover:bg-brand-hover active:scale-[0.96]"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/40" />
            <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">or</span>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          {/* Email Invite Form */}
          <form onSubmit={handleSendEmailInvite} className="flex flex-col gap-3">
            <label htmlFor="clientEmail" className="text-xs font-medium text-foreground">
              Send Email Invitation
            </label>
            <div className="flex items-center gap-2">
              <input
                id="clientEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@company.com"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white shadow-xs transition-transform hover:bg-neutral-800 active:scale-[0.96] dark:bg-neutral-100 dark:text-neutral-900"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{loading ? "Sending..." : "Send"}</span>
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
