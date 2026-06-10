"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient, useSession } from "@/lib/auth-client";

export default function DashboardPage() {
  const router = useRouter();

  const { data: session, isPending } = useSession();

  const clickHandler = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  if (isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <Button onClick={clickHandler}>Sign Out</Button>
    </div>
  );
};