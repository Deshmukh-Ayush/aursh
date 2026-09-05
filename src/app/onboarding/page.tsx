import { Onboard } from "@/components/onboarding/onboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Up Your Workspace",
  description: "Get started with Scrunity by setting up your organization and workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingPage() {
  return (
    <div>
      <Onboard />
    </div>
  )
}