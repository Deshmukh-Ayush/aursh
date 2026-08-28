"use client";

import React from "react";
import { InvoiceData, calculateInvoiceTotals, formatInvoiceMoney } from "@/lib/invoices/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Ban } from "lucide-react";

interface InvoiceDocumentViewProps {
  invoice: InvoiceData;
  className?: string;
}

export function InvoiceDocumentView({ invoice, className }: InvoiceDocumentViewProps) {
  const totals = calculateInvoiceTotals(invoice.lineItems, invoice.billingDetails);
  const themeColor = invoice.themeColor || "#00AAF7";

  const formattedInvoiceDate = invoice.invoiceDate
    ? new Date(invoice.invoiceDate).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-";

  const formattedDueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-";

  const fontClass =
    invoice.fontFamily === "serif"
      ? "font-serif"
      : invoice.fontFamily === "mono"
      ? "font-mono"
      : "font-sans";

  const getStatusBadge = () => {
    switch (invoice.status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
            <CheckCircle2 className="w-3 h-3" />
            PAID
          </span>
        );
      case "sent":
      case "viewed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wide">
            <Clock className="w-3 h-3" />
            {invoice.status}
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 uppercase tracking-wide">
            OVERDUE
          </span>
        );
      case "void":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20 uppercase tracking-wide">
            <Ban className="w-3 h-3" />
            VOID
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 uppercase tracking-wide">
            DRAFT
          </span>
        );
    }
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] rounded-2xl border border-neutral-200/90 dark:border-neutral-800 overflow-hidden",
        fontClass,
        className
      )}
      style={{ minHeight: "860px" }}
    >
      {/* Top Accent Strip */}
      <div className="h-1.5 w-full" style={{ backgroundColor: themeColor }} />

      <div className="p-8 sm:p-12 space-y-7">
        {/* Header Block: Hero Invoice Title + Meta Block */}
        <div className="flex flex-wrap items-start justify-between gap-6 pb-2">
          {/* Left Title / Branding */}
          <div className="space-y-2">
            {invoice.companySnapshot?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={invoice.companySnapshot.logoUrl}
                alt="Logo"
                className="h-10 max-w-[180px] object-contain mb-3 rounded-md ring-1 ring-black/5 dark:ring-white/10"
              />
            ) : null}
            <div
              className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono"
              style={{ color: themeColor }}
            >
              Invoice {invoice.invoiceNumber || "INV-001"}
            </div>
            <div>{getStatusBadge()}</div>
          </div>

          {/* Right Meta Info Table */}
          <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400 min-w-[180px]">
            <div className="grid grid-cols-2 gap-4 py-0.5">
              <span className="text-neutral-500 font-medium">Serial Number:</span>
              <span className="font-mono text-neutral-900 dark:text-neutral-100 font-semibold text-right">
                {String(invoice.serialNumber || 1).padStart(4, "0")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 py-0.5">
              <span className="text-neutral-500 font-medium">Date:</span>
              <span className="font-mono text-neutral-900 dark:text-neutral-100 font-semibold text-right">
                {formattedInvoiceDate}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 py-0.5">
              <span className="text-neutral-500 font-medium">Due Date:</span>
              <span className="font-mono text-neutral-900 dark:text-neutral-100 font-semibold text-right">
                {formattedDueDate}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 py-0.5">
              <span className="text-neutral-500 font-medium">Currency:</span>
              <span className="font-mono text-neutral-900 dark:text-neutral-100 font-semibold text-right">
                {invoice.currency || "USD"}
              </span>
            </div>
          </div>
        </div>

        {/* Billed By & Billed To Side-by-Side Highlight Cards (Invoicely Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Billed By (From) */}
          <div className="bg-neutral-50 dark:bg-neutral-900/60 p-4 sm:p-5 rounded-xl border border-neutral-200/70 dark:border-neutral-800 space-y-2">
            <p
              className="font-bold text-[11px] uppercase tracking-wider"
              style={{ color: themeColor }}
            >
              Billed By
            </p>
            <p className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
              {invoice.companySnapshot?.name || "Your Company Name"}
            </p>
            {invoice.companySnapshot?.address && (
              <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-line leading-relaxed">
                {invoice.companySnapshot.address}
              </p>
            )}
            {invoice.companySnapshot?.email && (
              <p className="text-neutral-600 dark:text-neutral-400">
                {invoice.companySnapshot.email}
              </p>
            )}
            {invoice.companySnapshot?.phone && (
              <p className="text-neutral-600 dark:text-neutral-400">
                {invoice.companySnapshot.phone}
              </p>
            )}
            {invoice.companySnapshot?.customFields?.map((field) => (
              <p key={field.id} className="text-neutral-500 text-[11px]">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{field.label}:</span>{" "}
                {field.value}
              </p>
            ))}
          </div>

          {/* Billed To (To) */}
          <div className="bg-neutral-50 dark:bg-neutral-900/60 p-4 sm:p-5 rounded-xl border border-neutral-200/70 dark:border-neutral-800 space-y-2">
            <p
              className="font-bold text-[11px] uppercase tracking-wider"
              style={{ color: themeColor }}
            >
              Billed To
            </p>
            <p className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
              {invoice.clientSnapshot?.name || "Client Name"}
            </p>
            {invoice.clientSnapshot?.address && (
              <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-line leading-relaxed">
                {invoice.clientSnapshot.address}
              </p>
            )}
            {invoice.clientSnapshot?.email && (
              <p className="text-neutral-600 dark:text-neutral-400">
                {invoice.clientSnapshot.email}
              </p>
            )}
            {invoice.clientSnapshot?.phone && (
              <p className="text-neutral-600 dark:text-neutral-400">
                {invoice.clientSnapshot.phone}
              </p>
            )}
            {invoice.clientSnapshot?.customFields?.map((field) => (
              <p key={field.id} className="text-neutral-500 text-[11px]">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{field.label}:</span>{" "}
                {field.value}
              </p>
            ))}
          </div>
        </div>

        {/* Line Items Table with Solid Theme Color Header */}
        <div className="overflow-hidden rounded-xl border border-neutral-200/80 dark:border-neutral-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className="text-white font-bold text-[11px] uppercase tracking-wider"
                style={{ backgroundColor: themeColor }}
              >
                <th className="py-3 px-4 font-semibold">Item</th>
                <th className="py-3 px-4 text-center w-16 font-semibold">Qty</th>
                <th className="py-3 px-4 text-right w-28 font-semibold">Price</th>
                <th className="py-3 px-4 text-right w-28 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80 bg-white dark:bg-neutral-950">
              {invoice.lineItems && invoice.lineItems.length > 0 ? (
                invoice.lineItems.map((item, idx) => {
                  const lineTotal = (item.quantity || 1) * (item.unitPrice || 0);
                  return (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {item.itemName || "Untitled Item"}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-neutral-700 dark:text-neutral-300">
                        {item.quantity || 1}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                        {formatInvoiceMoney(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-neutral-900 dark:text-neutral-100">
                        {formatInvoiceMoney(lineTotal, invoice.currency)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-neutral-400 italic">
                    No items added to invoice yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Section: Notes/Payment on Left, Calculations Box on Right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {/* Left: Payment Info & Notes */}
          <div className="space-y-4 text-xs">
            {invoice.paymentInformation && invoice.paymentInformation.length > 0 && (
              <div className="bg-neutral-50 dark:bg-neutral-900/60 rounded-xl p-4 border border-neutral-200/70 dark:border-neutral-800 space-y-2">
                <p
                  className="font-bold text-[11px] uppercase tracking-wider"
                  style={{ color: themeColor }}
                >
                  Payment Information
                </p>
                <div className="space-y-1.5 font-mono">
                  {invoice.paymentInformation.map((info) => (
                    <div key={info.id} className="flex items-center justify-between gap-4">
                      <span className="text-neutral-500 font-sans">{info.label}:</span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {info.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invoice.paymentTerms && (
              <div className="space-y-1">
                <p className="font-bold text-[10px] uppercase text-neutral-400 tracking-wider">
                  Payment Terms
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {invoice.paymentTerms}
                </p>
              </div>
            )}

            {invoice.notes && (
              <div className="space-y-1">
                <p className="font-bold text-[10px] uppercase text-neutral-400 tracking-wider">
                  Notes
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-line leading-relaxed">
                  {invoice.notes}
                </p>
              </div>
            )}

            {invoice.additionalTerms && (
              <div className="space-y-1">
                <p className="font-bold text-[10px] uppercase text-neutral-400 tracking-wider">
                  Terms & Conditions
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-line leading-relaxed">
                  {invoice.additionalTerms}
                </p>
              </div>
            )}
          </div>

          {/* Right: Calculations Summary Box */}
          <div className="space-y-3">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 font-medium">Subtotal</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums font-mono">
                  {formatInvoiceMoney(totals.subtotal, invoice.currency)}
                </span>
              </div>

              {totals.computedBilling.map((b) => (
                <div
                  key={b.id}
                  className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800"
                >
                  <span className="text-neutral-500">
                    {b.label} {b.type === "percentage" && `(${b.rawValue}%)`}
                  </span>
                  <span
                    className={cn(
                      "font-semibold tabular-nums font-mono",
                      b.computedAmount < 0 ? "text-emerald-600" : "text-neutral-800 dark:text-neutral-200"
                    )}
                  >
                    {b.computedAmount >= 0 ? "+" : ""}
                    {formatInvoiceMoney(b.computedAmount, invoice.currency)}
                  </span>
                </div>
              ))}

              {/* Total Due Pill */}
              <div
                className="flex items-center justify-between p-4 rounded-xl border mt-3 transition-colors"
                style={{
                  backgroundColor: `${themeColor}12`,
                  borderColor: `${themeColor}35`,
                }}
              >
                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Total Due
                </span>
                <span
                  className="text-xl sm:text-2xl font-black font-mono tabular-nums tracking-tight"
                  style={{ color: themeColor }}
                >
                  {formatInvoiceMoney(totals.total, invoice.currency)}
                </span>
              </div>
            </div>

            {/* Signature Area */}
            {invoice.companySnapshot?.signatureUrl && (
              <div className="pt-4 flex flex-col items-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={invoice.companySnapshot.signatureUrl}
                  alt="Signature"
                  className="h-10 max-w-[140px] object-contain mb-1 rounded ring-1 ring-black/5 dark:ring-white/10"
                />
                <div className="w-40 border-t border-neutral-300 dark:border-neutral-700 pt-1 text-right">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                    Authorized Signature
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Document Footer Note */}
        <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400">
          <span>Scrunity Invoice System</span>
          <span>Thank you for your business</span>
        </div>
      </div>
    </div>
  );
}
