"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InvoiceData } from "@/lib/invoices/types";
import { InvoiceDocumentView } from "@/components/invoices/invoice-document-view";
import { ArrowLeft, DownloadSimple, Printer } from "@phosphor-icons/react";

interface InvoiceViewClientProps {
  invoice: InvoiceData;
  projectId: string;
  isAgency: boolean;
}

export function InvoiceViewClient({
  invoice,
  projectId,
  isAgency,
}: InvoiceViewClientProps) {
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (invoice.pdfUrl) {
      window.open(invoice.pdfUrl, "_blank");
    } else {
      window.print();
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] pb-16 bg-neutral-50/50 dark:bg-neutral-900/20">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Navigation & Actions Top Bar */}
        <div className="flex items-center justify-between pb-6 print:hidden">
          <Link
            href={`/projects/${projectId}/payments`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Payments</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/60 bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-xs font-medium transition-colors"
            >
              <DownloadSimple size={14} />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* The Invoice Document */}
        <InvoiceDocumentView invoice={invoice} className="max-w-4xl mx-auto" />
      </div>
    </div>
  );
}
