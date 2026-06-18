"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { resendInviteAction } from "@/app/actions/project";

export function ResendInviteButton({ projectId }: { projectId: string }) {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the parent <Link> from navigating
    setIsSending(true);
    const result = await resendInviteAction(projectId);
    setIsSending(false);

    if (result.error) {
      alert(result.error);
    } else {
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="h-6 text-[10px] px-2 relative z-20" 
      onClick={handleResend}
      disabled={isSending || sent}
    >
      {isSending ? "Sending..." : sent ? "Sent!" : "Resend"}
    </Button>
  );
}
