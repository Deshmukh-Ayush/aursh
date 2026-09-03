"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { InvoiceBuilder } from "@/components/invoices/invoice-builder";

interface NewInvoicePageClientProps {
  projectId: string;
  projectName?: string;
  projectCurrency?: "USD" | "INR";
  initialMilestoneId?: string | null;
  initialMilestone?: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    dueDate?: string | Date | null;
  } | null;
}

export function NewInvoicePageClient({
  projectId,
  projectName,
  projectCurrency,
  initialMilestoneId,
  initialMilestone,
}: NewInvoicePageClientProps) {
  const router = useRouter();

  const handleDone = () => {
    router.push(`/projects/${projectId}/payments`);
    router.refresh();
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col bg-background">
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col h-[calc(100vh-5rem)] border border-border/40 rounded-2xl shadow-xl overflow-hidden my-2 sm:my-4">
        <InvoiceBuilder
          projectId={projectId}
          projectName={projectName}
          projectCurrency={projectCurrency}
          initialMilestoneId={initialMilestoneId}
          initialMilestone={initialMilestone}
          onSuccess={handleDone}
          onClose={handleDone}
        />
      </div>
    </div>
  );
}
