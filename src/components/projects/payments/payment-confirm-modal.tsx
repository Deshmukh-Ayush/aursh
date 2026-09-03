"use client";

import React, { useState, useRef } from "react";
import { Drawer } from "vaul";
import { X, CloudArrowUp, FileText, Image as PhImage, CheckCircle, Spinner, SealCheck } from "@phosphor-icons/react";
import { usePaymentStore } from "@/store/payment-store";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { cn } from "@/lib/utils";

type PaymentConfirmModalProps = {
  formatMoney: (amountInUnits: number, curr?: string) => string;
  isAgency?: boolean;
};

export function PaymentConfirmModal({ formatMoney, isAgency = false }: PaymentConfirmModalProps) {
  const router = useRouter();

  const milestone = usePaymentStore((state) => state.payModalMilestone);
  const selectedMethod = usePaymentStore((state) => state.selectedMethod);
  const referenceNote = usePaymentStore((state) => state.referenceNote);
  const isSubmitting = usePaymentStore((state) => state.isSubmitting);

  const setSelectedMethod = usePaymentStore((state) => state.setSelectedMethod);
  const setReferenceNote = usePaymentStore((state) => state.setReferenceNote);
  const setIsSubmitting = usePaymentStore((state) => state.setIsSubmitting);
  const resetConfirmForm = usePaymentStore((state) => state.resetConfirmForm);

  // Client proof upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOpen = !!milestone;

  const handleClose = () => {
    setSelectedFile(null);
    setDragActive(false);
    setUploadProgressText("");
    resetConfirmForm();
  };

  // Agency Manual Mark-Paid handler
  const handleAgencyConfirm = async () => {
    if (!milestone) return;
    setIsSubmitting(true);

    try {
      const res = await axios.post("/api/milestones/mark-paid", {
        milestoneId: milestone.id,
        paymentMethod: selectedMethod,
        referenceNote,
      });

      if (res.data.success) {
        posthog.capture("milestone_payment_confirmed", {
          currency: milestone.currency,
          payment_method: selectedMethod,
        });
        toast.success("Payment marked as received");
        handleClose();
        router.refresh();
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || "Failed to confirm payment"
        : "Failed to confirm payment";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Client Proof Upload handler
  const handleClientUpload = async () => {
    if (!milestone || !selectedFile) {
      toast.error("Please choose a payment proof file to upload.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgressText("Uploading proof & running OCR extraction…");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("milestoneId", milestone.id);

      const res = await axios.post("/api/payments/proof/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        toast.success("Payment proof submitted! Awaiting agency verification.");
        handleClose();
        router.refresh();
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || "Failed to submit payment proof"
        : "Failed to submit payment proof";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setUploadProgressText("");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error("Please upload a valid image (PNG, JPG) or PDF file.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File exceeds maximum size limit of 15MB.");
      return;
    }
    setSelectedFile(file);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 transition-opacity" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[92vh] z-50 flex flex-col rounded-t-[24px] bg-background border-t border-border/40 shadow-2xl overflow-hidden focus:outline-hidden">
          <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-muted-foreground/30 my-3" />
          <div className="overflow-y-auto px-4 sm:px-8 pb-10 pt-2 max-w-2xl mx-auto w-full flex-1">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-border/40">
              <div>
                <Drawer.Title className="text-xl font-bold tracking-tight text-foreground">
                  {isAgency ? "Confirm Payment Received" : "Upload Proof of Payment"}
                </Drawer.Title>
                <Drawer.Description className="text-xs text-muted-foreground mt-0.5">
                  {isAgency
                    ? "Record payment receipt and log reference notes for financial audit."
                    : "Upload your transaction receipt, UPI screenshot, or bank wire slip for agency verification."}
                </Drawer.Description>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors active:scale-[0.96]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {milestone && (
              <div className="space-y-5">
                {/* Milestone Summary Card */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Target Milestone
                  </span>
                  <div className="text-sm font-semibold text-foreground">{milestone.title}</div>
                  <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                    {formatMoney(milestone.amount, milestone.currency)}
                  </div>
                </div>

                {/* Branch UI: Agency Manual Entry vs Client Proof Upload */}
                {isAgency ? (
                  /* ─── AGENCY VIEW: Manual Entry ─── */
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground block">Select Payment Method</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "upi", label: "UPI / GPay / PhonePe" },
                          { id: "bank_transfer", label: "Bank Transfer / NEFT" },
                          { id: "card", label: "Card / Payment Link" },
                          { id: "cash", label: "Cash / Other" },
                        ].map((method) => (
                          <button
                            type="button"
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            className={`p-3 rounded-xl border text-left text-xs font-medium transition-all active:scale-[0.96] ${
                              selectedMethod === method.id
                                ? "border-brand bg-brand/10 font-semibold text-foreground ring-1 ring-brand/20"
                                : "border-border/50 bg-background hover:bg-muted/30 text-muted-foreground"
                            }`}
                          >
                            {method.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground block">
                        UTR / Transaction Reference (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 123456789012 or GPay Txn ID"
                        value={referenceNote}
                        onChange={(e) => setReferenceNote(e.target.value)}
                        className="w-full h-10 px-3 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand font-mono"
                      />
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t border-border/40">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="active:scale-[0.96] transition-transform h-9 px-4 rounded-xl border border-border/60 text-xs font-medium hover:bg-muted"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAgencyConfirm}
                        disabled={isSubmitting}
                        className="active:scale-[0.96] transition-transform h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <SealCheck size={16} weight="bold" />
                        {isSubmitting ? "Confirming…" : "Confirm Payment Received"}
                      </button>
                    </div>
                  </>
                ) : (
                  /* ─── CLIENT VIEW: File Proof Upload Dropzone ─── */
                  <>
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-foreground block">
                        Payment Confirmation Document
                      </label>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf,.webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            validateAndSetFile(e.target.files[0]);
                          }
                        }}
                      />

                      {!selectedFile ? (
                        <div
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            "cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center gap-3",
                            dragActive
                              ? "border-brand bg-brand/5 scale-[1.01]"
                              : "border-border/70 hover:border-brand/60 hover:bg-muted/30 bg-muted/10"
                          )}
                        >
                          <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                            <CloudArrowUp size={24} weight="bold" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-foreground">
                              Click to browse or drag and drop proof here
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Supports PNG, JPG, JPEG, and PDF receipts (up to 15MB)
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between">
                          <div className="flex items-center gap-3 truncate">
                            <div className="w-10 h-10 rounded-lg bg-background border border-border/60 flex items-center justify-center text-brand shrink-0">
                              {selectedFile.type === "application/pdf" ? (
                                <FileText size={20} weight="bold" />
                              ) : (
                                <PhImage size={20} weight="bold" />
                              )}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-foreground truncate">{selectedFile.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-medium"
                          >
                            Change
                          </button>
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                        Once uploaded, our OCR system will extract the reference ID and amount, and your agency will review and finalize the payment.
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t border-border/40">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="active:scale-[0.96] transition-transform h-9 px-4 rounded-xl border border-border/60 text-xs font-medium hover:bg-muted"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleClientUpload}
                        disabled={isSubmitting || !selectedFile}
                        className="active:scale-[0.96] transition-transform h-9 px-5 rounded-xl bg-brand text-white hover:bg-brand-hover font-semibold text-xs shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Spinner size={16} className="animate-spin" />
                            <span>{uploadProgressText || "Processing…"}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} weight="bold" />
                            <span>Submit Proof for Verification</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
