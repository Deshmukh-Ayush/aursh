import type { MilestoneWithDetails, PaymentRecord } from "@/store/types";
import type { InvoiceData } from "@/lib/invoices/types";
import type { PaymentProofItem } from "./payment-proof-review-modal";

export type { MilestoneWithDetails, PaymentRecord } from "@/store/types";

export type PaymentsViewClientProps = {
  projectId: string;
  milestones: MilestoneWithDetails[];
  payments: PaymentRecord[];
  invoices?: InvoiceData[];
  paymentProofs?: PaymentProofItem[];
  currentUserId: string;
  userRole: "owner" | "agency" | "client";
  deliverablesList: Array<{ id: string; title: string }>;
};

export type PaymentsTabKey = "all" | "due" | "paid" | "upcoming";

export type PaymentsTab = {
  id: PaymentsTabKey;
  label: string;
};
