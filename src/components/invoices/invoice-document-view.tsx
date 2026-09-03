"use client";

import React from "react";
import { InvoiceData, calculateInvoiceTotals, formatInvoiceMoney } from "@/lib/invoices/types";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, Prohibit } from "@phosphor-icons/react";

interface InvoiceDocumentViewProps {
  invoice: InvoiceData;
  className?: string;
}

export function getContrastTextColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const clean = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  // Calculate relative luminance / YIQ
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#09090b" : "#ffffff";
}

export function InvoiceDocumentView({ invoice, className }: InvoiceDocumentViewProps) {
  const totals = calculateInvoiceTotals(invoice.lineItems, invoice.billingDetails);
  const themeColor = invoice.themeColor || "#000000";

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
    let dotColor = "bg-neutral-300 dark:bg-neutral-600";
    let statusText = "DRAFT";
    let Icon = null;
    let iconColor = "text-neutral-400";
    
    switch (invoice.status) {
      case "paid":
        dotColor = "bg-emerald-500";
        statusText = "PAID";
        Icon = CheckCircle;
        iconColor = "text-emerald-500";
        break;
      case "sent":
      case "viewed":
        dotColor = "bg-blue-500";
        statusText = invoice.status.toUpperCase();
        Icon = Clock;
        iconColor = "text-blue-500";
        break;
      case "payment_submitted":
        dotColor = "bg-amber-500";
        statusText = "PAYMENT SUBMITTED";
        Icon = Clock;
        iconColor = "text-amber-500";
        break;
      case "overdue":
        dotColor = "bg-rose-500";
        statusText = "OVERDUE";
        break;
      case "void":
        dotColor = "bg-neutral-500";
        statusText = "VOID";
        Icon = Prohibit;
        iconColor = "text-neutral-500";
        break;
    }

    return (
      <div className="flex items-center gap-1.5 justify-end">
        <div className={cn("w-1 h-1 rounded-full", dotColor)} aria-hidden="true" />
        {Icon && <Icon weight="bold" className={cn("w-3 h-3", iconColor)} aria-hidden="true" />}
        <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          {statusText}
        </span>
      </div>
    );
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
      <div className="p-8 sm:p-12 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          {/* Left: Logo */}
          <div className="w-1/2">
            {invoice.companySnapshot?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={invoice.companySnapshot.logoUrl}
                alt={`${invoice.companySnapshot.name || "Company"} logo`}
                className="h-10 max-w-[180px] object-contain"
              />
            )}
          </div>

          {/* Right: Invoice Number & Status */}
          <div className="text-right">
            <div 
              className="text-3xl font-semibold tracking-tight font-mono"
              style={{ color: themeColor }}
            >
              Invoice {invoice.invoiceNumber || "INV-001"}
            </div>
            <div className="mt-2">
              {getStatusBadge()}
            </div>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            <span>Serial Number:</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
              {String(invoice.serialNumber || 1).padStart(4, "0")}
            </span>
          </div>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <div className="flex items-center gap-1.5">
            <span>Issue Date:</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
              {formattedInvoiceDate}
            </span>
          </div>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <div className="flex items-center gap-1.5">
            <span>Due Date:</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
              {formattedDueDate}
            </span>
          </div>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <div className="flex items-center gap-1.5">
            <span>Currency:</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100 font-mono">
              {invoice.currency || "USD"}
            </span>
          </div>
        </div>

        <hr className="border-t border-neutral-200 dark:border-neutral-800" />

        {/* Billed By & Billed To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
          {/* From */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
              From
            </p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {invoice.companySnapshot?.name || "Your Company Name"}
            </p>
            {invoice.companySnapshot?.address && (
              <p className="text-neutral-500 whitespace-pre-line leading-relaxed text-pretty text-[13px]">
                {invoice.companySnapshot.address}
              </p>
            )}
            {invoice.companySnapshot?.email && (
              <p className="text-neutral-500 break-all text-[13px]">
                {invoice.companySnapshot.email}
              </p>
            )}
            {invoice.companySnapshot?.phone && (
              <p className="text-neutral-500 text-[13px]">
                {invoice.companySnapshot.phone}
              </p>
            )}
            {invoice.companySnapshot?.customFields?.map((field) => (
              <p key={field.id} className="text-neutral-500 text-[11px]">
                {field.label}: <span className="font-mono text-neutral-700 dark:text-neutral-300">{field.value}</span>
              </p>
            ))}
          </div>

          {/* To */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
              To
            </p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {invoice.clientSnapshot?.name || "Client Name"}
            </p>
            {invoice.clientSnapshot?.address && (
              <p className="text-neutral-500 whitespace-pre-line leading-relaxed text-pretty text-[13px]">
                {invoice.clientSnapshot.address}
              </p>
            )}
            {invoice.clientSnapshot?.email && (
              <p className="text-neutral-500 break-all text-[13px]">
                {invoice.clientSnapshot.email}
              </p>
            )}
            {invoice.clientSnapshot?.phone && (
              <p className="text-neutral-500 text-[13px]">
                {invoice.clientSnapshot.phone}
              </p>
            )}
            {invoice.clientSnapshot?.customFields?.map((field) => (
              <p key={field.id} className="text-neutral-500 text-[11px]">
                {field.label}: <span className="font-mono text-neutral-700 dark:text-neutral-300">{field.value}</span>
              </p>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="mt-8 pt-4">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium border-b border-neutral-200 dark:border-neutral-800">
                <th scope="col" className="pb-3 font-medium">Item</th>
                <th scope="col" className="pb-3 text-center w-16 font-medium">Qty</th>
                <th scope="col" className="pb-3 text-right w-28 font-medium">Price</th>
                <th scope="col" className="pb-3 text-right w-28 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {invoice.lineItems && invoice.lineItems.length > 0 ? (
                invoice.lineItems.map((item, idx) => {
                  const lineTotal = (item.quantity || 1) * (item.unitPrice || 0);
                  return (
                    <tr key={item.id || idx}>
                      <td className="py-4 pr-4">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {item.itemName || "Untitled Item"}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed text-pretty">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center font-mono tabular-nums text-neutral-500">
                        {item.quantity || 1}
                      </td>
                      <td className="py-4 px-4 text-right font-mono tabular-nums text-neutral-500">
                        {formatInvoiceMoney(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="py-4 pl-4 text-right font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                        {formatInvoiceMoney(lineTotal, invoice.currency)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-neutral-400 text-xs">
                    No items added to invoice yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary & Notes Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
          {/* Left: Notes & Payment Info */}
          <div className="space-y-6 text-sm">
            {invoice.paymentInformation && invoice.paymentInformation.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase text-neutral-400 tracking-wider font-medium">
                  Payment Information
                </p>
                <div className="space-y-1">
                  {invoice.paymentInformation.map((info) => (
                    <div key={info.id} className="flex gap-2">
                      <span className="text-neutral-500 text-[13px]">{info.label}:</span>
                      <span className="text-neutral-900 dark:text-neutral-100 font-mono text-xs mt-0.5">
                        {info.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invoice.paymentTerms && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase text-neutral-400 tracking-wider font-medium">
                  Payment Terms
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-pretty text-[13px]">
                  {invoice.paymentTerms}
                </p>
              </div>
            )}

            {invoice.notes && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase text-neutral-400 tracking-wider font-medium">
                  Notes
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-line leading-relaxed text-pretty text-[13px]">
                  {invoice.notes}
                </p>
              </div>
            )}

            {invoice.additionalTerms && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase text-neutral-400 tracking-wider font-medium">
                  Terms & Conditions
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-line leading-relaxed text-pretty text-[13px]">
                  {invoice.additionalTerms}
                </p>
              </div>
            )}
          </div>

          {/* Right: Calculations */}
          <div className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                  {formatInvoiceMoney(totals.subtotal, invoice.currency)}
                </span>
              </div>

              {totals.computedBilling.map((b) => (
                <div key={b.id} className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>
                    {b.label} {b.type === "percentage" && `(${b.rawValue}%)`}
                  </span>
                  <span className="font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                    {b.computedAmount >= 0 ? "+" : ""}
                    {formatInvoiceMoney(b.computedAmount, invoice.currency)}
                  </span>
                </div>
              ))}
            </div>

            <hr className="border-t border-neutral-200 dark:border-neutral-800" />

            <div className="flex justify-between items-baseline pt-2">
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Total Due
              </span>
              <span
                className="text-2xl font-semibold tracking-tight font-mono tabular-nums"
                style={{ color: themeColor }}
              >
                {formatInvoiceMoney(totals.total, invoice.currency)}
              </span>
            </div>

            {/* Signature */}
            {invoice.companySnapshot?.signatureUrl && (
              <div className="pt-12 flex flex-col items-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={invoice.companySnapshot.signatureUrl}
                  alt={`${invoice.companySnapshot.name || "Company"} authorized signature`}
                  className="h-10 max-w-[140px] object-contain mb-2"
                />
                <div className="w-48 border-t border-neutral-200 dark:border-neutral-800 pt-2 text-right">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium">
                    Authorized Signature
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400">
          <span>Scrunity</span>
          <span>Thank you for your business</span>
        </div>
      </div>
    </div>
  );
}
