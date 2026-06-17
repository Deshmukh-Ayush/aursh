"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { acceptProjectInvitation } from "@/app/actions/invite";
import { useRouter } from "next/navigation";

export function AcceptInviteButton({ needsLogin, token }: { needsLogin: boolean, token?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAction = async () => {
    setIsLoading(true);

    if (needsLogin) {
      // Sign in with Google and redirect back here
      await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.href,
      });
      // Window will reload automatically upon sign in flow completion
      return;
    }

    if (!token) return;

    const result = await acceptProjectInvitation(token);
    setIsLoading(false);

    if (result.error) {
      alert(result.error);
    } else {
      // Redirect to dashboard (or specific project later)
      router.push("/dashboard");
    }
  };

  return (
    <Button onClick={handleAction} disabled={isLoading} className="w-full">
      {isLoading ? "Processing..." : needsLogin ? "Sign in with Google" : "Accept Invitation"}
    </Button>
  );
}
