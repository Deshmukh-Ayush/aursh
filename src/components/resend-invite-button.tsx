"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";

export function ResendInviteButton({ projectId }: { projectId: string }) {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the parent <Link> from navigating
    setIsSending(true);
    try {
      const res = await axios.post('/api/projects/invites/resend', { projectId });
      if (res.data.success) {
        setSent(true);
        toast.success("Invitation resent successfully");
        setTimeout(() => setSent(false), 3000);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "A server or network error occurred.");
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
