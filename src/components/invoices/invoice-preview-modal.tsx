"use client";

import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Download, X, CheckCircle2, Send, Loader2, FileText, Ban } from "lucide-react";
import { InvoiceData } from "@/lib/invoices/types";
import { InvoiceDocumentView } from "./invoice-document-view";

interface InvoicePreviewModalProps {
  invoice: InvoiceData | null;
  isOpen: boolean;
  onClose: () => void;
  isAgency: boolean;
}

export function InvoicePreviewModal({
  invoice,
  isOpen,
  onClose,
  isAgency,
}: InvoicePreviewModalProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !invoice) return null;

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      if (invoice.pdfUrl) {
        window.open(invoice.pdfUrl, "_blank");
      } else {
        const { generateInvoicePdf } = await import("@/lib/invoices/pdf-generator");
        const pdfBytes = await generateInvoicePdf(invoice);
        const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Invoice-${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download invoice PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAction = async (action: "mark_paid" | "send" | "void") => {
    setIsProcessing(true);
    try {
      const res = await axios.patch("/api/invoices", {
        invoiceId: invoice.id,
        action,
      });

      if (res.data.success) {
        toast.success(
          action === "mark_paid"
            ? "Invoice marked as paid!"
            : action === "send"
            ? "Invoice sent to client!"
            : "Invoice voided"
        );
        router.refresh();
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to update invoice";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-background border border-border/60 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden focus:outline-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-3.5 border-b border-border/40 flex items-center justify-between bg-card/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-2xs"
              style={{ backgroundColor: invoice.themeColor || "#4F46E5" }}
            >
              <FileText className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground">
                Invoice #{invoice.invoiceNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="active:scale-[0.96] transition-transform h-8.5 px-3.5 rounded-xl border border-border/70 bg-background hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-brand" />
              )}
              <span>Download PDF</span>
            </button>

            {isAgency && invoice.status === "draft" && (
              <button
                type="button"
                onClick={() => handleAction("send")}
                disabled={isProcessing}
                className="active:scale-[0.96] transition-transform h-8.5 px-3.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                style={{ backgroundColor: invoice.themeColor || "#4F46E5" }}
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 stroke-[2.2]" />
                )}
                <span>Send to Client</span>
              </button>
            )}

            {invoice.status !== "paid" && invoice.status !== "void" && (
              <button
                type="button"
                onClick={() => handleAction("mark_paid")}
                disabled={isProcessing}
                className="active:scale-[0.96] transition-transform h-8.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.2]" />
                )}
                <span>Mark Paid</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="h-8.5 w-8.5 rounded-xl hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Document View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-muted/20 flex justify-center">
          <div className="w-full max-w-3xl">
            <InvoiceDocumentView invoice={invoice} />
          </div>
        </div>
      </div>
    </div>
  );
}
