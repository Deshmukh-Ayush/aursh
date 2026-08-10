import posthog from "posthog-js"

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

if (!projectToken || !host) {
  if (process.env.NODE_ENV === "development") {
    const missingVariable = !projectToken
      ? "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"
      : "NEXT_PUBLIC_POSTHOG_HOST"

    console.warn(
      `[PostHog] ${missingVariable} is missing or unconfigured. Analytics events will be skipped until configured.`
    )
  }
} else {
  posthog.init(projectToken, {
    api_host: host,
    tracing_headers: [window.location.hostname],
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  })
}
