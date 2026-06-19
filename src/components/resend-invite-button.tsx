"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { resendInviteAction } from "@/app/actions/project";
import { toast } from "sonner";

export function ResendInviteButton({ projectId }: { projectId: string }) {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the parent <Link> from navigating
    setIsSending(true);
    try {
      const result = await resendInviteAction(projectId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setSent(true);
        toast.success("Invitation resent successfully");
        setTimeout(() => setSent(false), 3000);
      }
    } catch (error) {
      console.error(error);
      toast.error("A server or network error occurred. Please check Vercel logs.");
    } finally {
      setIsSending(false);
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
