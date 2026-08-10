"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import posthog from "posthog-js"
import { useSession } from "@/lib/auth-client"

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <PostHogIdentity />
      <ThemeHotkey />
      {children}
    </NextThemesProvider>
  )
}

function PostHogIdentity() {
  const { data: sessionData } = useSession()
  const identifiedUserId = React.useRef<string | null>(null)
  const user = sessionData?.user

  React.useEffect(() => {
    if (!user?.id) {
      if (identifiedUserId.current) {
        posthog.reset()
        identifiedUserId.current = null
      }
      return
    }

    if (identifiedUserId.current === user.id) {
      return
    }

    if (identifiedUserId.current) {
      posthog.reset()
    }

    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
    })
    identifiedUserId.current = user.id
  }, [user?.email, user?.id, user?.name])

  return null
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (!event.key || event.key.toLowerCase() !== "d") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [resolvedTheme, setTheme])

  return null
}

export { ThemeProvider }
