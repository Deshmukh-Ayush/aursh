export type CustomField = {
  id: string;
  label: string;
  value: string;
};

export type CompanySnapshot = {
  name: string;
  logoUrl?: string | null;
  signatureUrl?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  customFields?: CustomField[];
};

export type ClientSnapshot = {
  name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  contactMethod?: "email" | "phone";
  customFields?: CustomField[];
};

export type BillingDetailRow = {
  id: string;
  label: string;
  type: "fixed" | "percentage";
  value: number; // For percentage: e.g. 18 for 18%. For fixed: amount in cents/paise (e.g. 5000 for $50.00)
};

export type PaymentInfoRow = {
  id: string;
  label: string;
  value: string;
};

export type InvoiceLineItemData = {
  id?: string;
  itemName: string;
  description?: string | null;
  quantity: number;
  unitPrice: number; // In cents/paise (e.g. 10000 = $100.00 / ₹100.00)
  lineTotal: number; // quantity * unitPrice
  sortOrder?: number;
};

export type InvoiceStatus = "draft" | "sent" | "viewed" | "payment_submitted" | "paid" | "overdue" | "void";

export type InvoiceData = {
  id: string;
  projectId: string;
  organizationId: string;
  milestoneId?: string | null;
  milestoneTitle?: string | null;
  invoiceNumber: string;
  prefix: string;
  serialNumber: number;
  currency: "USD" | "INR";
  themeColor: string;
  fontFamily?: "sans" | "serif" | "mono" | string;
  templatePreset?: "default" | "minimal" | "modern" | string;
  invoiceDate: string | Date;
  dueDate: string | Date;
  paymentTerms?: string | null;
  companySnapshot: CompanySnapshot;
  clientSnapshot: ClientSnapshot;
  billingDetails: BillingDetailRow[];
  lineItems: InvoiceLineItemData[];
  notes?: string | null;
  additionalTerms?: string | null;
  paymentInformation: PaymentInfoRow[];
  subtotal: number; // in cents/paise
  total: number; // in cents/paise
  status: InvoiceStatus;
  sentAt?: string | Date | null;
  viewedAt?: string | Date | null;
  paidAt?: string | Date | null;
  pdfUrl?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
};

/**
 * Computes subtotal, applied billing adjustments, and final total for an invoice.
 * Percentage rows apply against the running item subtotal.
 */
export function calculateInvoiceTotals(
  items: Array<{ quantity: number; unitPrice: number }>,
  billingDetails: BillingDetailRow[] = []
): {
  subtotal: number;
  computedBilling: Array<{ id: string; label: string; type: "fixed" | "percentage"; rawValue: number; computedAmount: number }>;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    return sum + qty * price;
  }, 0);

  let currentAdjustment = 0;
  const computedBilling = billingDetails.map((detail) => {
    let computedAmount = 0;
    if (detail.type === "percentage") {
      computedAmount = Math.round((subtotal * (Number(detail.value) || 0)) / 100);
    } else {
      computedAmount = Math.round(Number(detail.value) || 0);
    }
    currentAdjustment += computedAmount;
    return {
      id: detail.id,
      label: detail.label,
      type: detail.type,
      rawValue: detail.value,
      computedAmount,
    };
  });

  const total = Math.max(0, subtotal + currentAdjustment);

  return {
    subtotal,
    computedBilling,
    total,
  };
}

export function formatInvoiceMoney(amountInUnits: number, currency: "USD" | "INR" = "INR"): string {
  const mainUnits = amountInUnits / 100;
  if (currency === "USD") {
    return `$${mainUnits.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${mainUnits.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
