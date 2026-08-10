"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import posthog from "posthog-js";

export function SignOutButton() {
  const router = useRouter();

  const clickHandler = async () => {
    posthog.reset();
    await authClient.signOut();
    router.push("/sign-in");
  };

  return <Button onClick={clickHandler} variant="outline">Sign Out</Button>;
}
