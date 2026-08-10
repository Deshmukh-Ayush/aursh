"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import posthog from "posthog-js";

export function AcceptOrgInviteButton({ needsLogin, inviteId, overrideText }: { needsLogin: boolean, inviteId?: string, overrideText?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAction = async () => {
    setIsLoading(true);

    if (needsLogin) {
      posthog.reset();
      await authClient.signOut();
      
      // Sign in with Google and redirect back here
      await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.href,
      });
      // Window will reload automatically upon sign in flow completion
      return;
    }

    if (!inviteId) return;

    try {
      const res = await axios.post('/api/organizations/invites/accept', { inviteId });
      if (res.data.success) {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : null;
      toast.error(message || "Failed to accept invitation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleAction} disabled={isLoading} className="w-full">
      {isLoading ? "Processing..." : needsLogin ? (overrideText || "Sign in with Google") : "Accept Invitation"}
    </Button>
  );
}
