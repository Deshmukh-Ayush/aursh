"use client"

import React, { useEffect } from "react"
import { Bell } from "lucide-react"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils" // Assuming you have standard tailwind-merge util
import { BellIcon } from "@phosphor-icons/react"

// 1. Fixed TypeScript: Define strict types for the notification object
interface Notification {
  id: string
  projectId: string
  read: boolean
  type: string
  message: string
  createdAt: string | Date
}

interface FetcherResponse {
  notifications: Notification[]
}

const fetcher = async (url: string): Promise<FetcherResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.status}`)
  return res.json()
}

export function TopbarNotifications({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const { data, mutate } = useSWR<FetcherResponse>(
    "/api/notifications",
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const notifications = data?.notifications || []
  const projectNotifications = notifications.filter(
    (n) => n.projectId === projectId
  )
  const unreadCount = projectNotifications.filter((n) => !n.read).length
  const recentNotifications = projectNotifications.slice(0, 10)

  const displayCount = unreadCount > 99 ? "99+" : unreadCount

  const handleMarkAsRead = async (id?: string) => {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    })
    mutate()
  }

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      await handleMarkAsRead(n.id)
    }

    setIsOpen(false) 

    if (n.type.startsWith("contract")) {
      router.push(`/projects/${projectId}/contract`)
    } else if (
      n.type.startsWith("deliverable") ||
      n.type === "revision_requested"
    ) {
      router.push(`/projects/${projectId}/deliverables`)
    } else if (n.type.startsWith("comment")) {
      router.push(`/projects/${projectId}/discussions`)
    } else if (n.type === "file_uploaded") {
      router.push(`/projects/${projectId}/files`)
    } else {
      router.push(`/projects/${projectId}`)
    }
  }

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`Notifications, ${unreadCount} unread`}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors",
          "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          isOpen && "bg-muted/50"
        )}
      >
        <BellIcon weight="duotone" className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />

        {/* Better Interface: Softened primary color instead of harsh red, improved typography, added subtle animation */}
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 animate-in items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground tabular-nums ring-2 ring-background duration-300 zoom-in">
            {displayCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-[calc(100%+8px)] right-0 z-50 w-[calc(100vw-2rem)] animate-in overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg duration-200 fade-in slide-in-from-top-2 sm:w-80"
          role="dialog"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => handleMarkAsRead()}
                className="rounded-sm px-1 py-0.5 text-xs font-medium text-primary transition-colors hover:text-primary/80 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex max-h-87.5 flex-col overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                  <Bell className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-foreground/80">
                  You&apos;re all caught up
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No new notifications for this project.
                </p>
              </div>
            ) : (
              recentNotifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  // Semantic HTML: Changed from div to button since it's an interactive element
                  className={cn(
                    "flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-0",
                    "hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none",
                    !n.read && "bg-primary/5" // Soft primary tint for unread
                  )}
                >
                  {!n.read && (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                  )}
                  <div className={cn("flex flex-col gap-1", n.read && "ml-5")}>
                    <p className="text-sm leading-snug text-foreground">
                      {n.message}
                    </p>
                    <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
