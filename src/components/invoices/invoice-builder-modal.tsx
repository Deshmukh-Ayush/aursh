"use client";

import React, { useEffect } from "react";
import { InvoiceBuilder } from "./invoice-builder";

interface InvoiceBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  initialMilestoneId?: string | null;
  initialMilestone?: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    dueDate?: string | Date | null;
  } | null;
}

export function InvoiceBuilderModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  initialMilestoneId,
  initialMilestone,
}: InvoiceBuilderModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-builder-title"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200"
    >
      <div className="bg-background border border-border/60 rounded-2xl w-full max-w-7xl h-[92vh] flex flex-col shadow-2xl overflow-hidden focus-visible:outline-hidden">
        <InvoiceBuilder
          projectId={projectId}
          projectName={projectName}
          initialMilestoneId={initialMilestoneId}
          initialMilestone={initialMilestone}
          onClose={onClose}
          onSuccess={onClose}
        />
      </div>
    </div>
  );
}
