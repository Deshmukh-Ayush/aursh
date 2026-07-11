"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AcceptInviteButton({ needsLogin, token, overrideText }: { needsLogin: boolean, token?: string, overrideText?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAction = async () => {
    setIsLoading(true);

    if (needsLogin) {
      // If they are logged in with the wrong account, sign them out first before the new sign-in flow
      await authClient.signOut();
      
      // Sign in with Google and redirect back here
      await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.href,
      });
      // Window will reload automatically upon sign in flow completion
      return;
    }

    if (!token) return;

    try {
      const res = await axios.post('/api/projects/invites/accept', { token });
      if (res.data.success) {
        if (res.data.projectId) {
          router.push(`/projects/${res.data.projectId}/contract`);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to accept invitation");
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
