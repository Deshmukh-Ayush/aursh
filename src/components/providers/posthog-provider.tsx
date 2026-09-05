"use client";

import React, { useEffect, useRef, Suspense } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";

// Free tier safeguard note:
// PostHog free tier provides 1,000,000 events/month. Early-stage traffic will stay
// well within this limit, but revisit autocapture scope if event volume grows significantly.

function PostHogClientInit() {
  useEffect(() => {
    const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

    if (!projectToken) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[PostHog] NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is not configured. Telemetry skipped.");
      }
      return;
    }

    if (!posthog.__loaded) {
      posthog.init(projectToken, {
        api_host: host,
        // Autocapture clicks, form submissions, and interactions
        autocapture: true,
        // Disable automatic full-page reload capture; pageviews captured manually for Next.js App Router SPA navigation
        capture_pageview: false,
        capture_pageleave: true,
        // Shared cookie domain across .scrunity.com (app.scrunity.com & www.scrunity.com)
        cross_subdomain_cookie: true,
        // Prefer root cookie over stale subdomain localStorage
        __preview_cookie_wins_on_conflict: true,
        // Do NOT enable session recording / replay (separate free tier meter)
        disable_session_recording: true,
        defaults: "2026-01-30",
        debug: process.env.NODE_ENV === "development",
      });
    }
  }, []);

  return null;
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && typeof window !== "undefined") {
      let url = window.origin + pathname;
      const search = searchParams?.toString();
      if (search) {
        url += `?${search}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

function PostHogIdentity() {
  const { data: sessionData } = useSession();
  const identifiedUserId = useRef<string | null>(null);
  const user = sessionData?.user;

  useEffect(() => {
    if (!user?.id) {
      // User logged out
      if (identifiedUserId.current) {
        posthog.reset();
        identifiedUserId.current = null;
      }
      return;
    }

    if (identifiedUserId.current === user.id) {
      return;
    }

    // Call posthog.identify to link anonymous landing page distinct_id with authenticated user ID
    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
    });
    identifiedUserId.current = user.id;
  }, [user?.email, user?.id, user?.name]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <PostHogClientInit />
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PostHogIdentity />
      {children}
    </PHProvider>
  );
}
