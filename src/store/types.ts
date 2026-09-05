export type StoreSetter<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean
) => void;

export interface ProposalLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

export interface ProposalDraft {
  id?: string;
  title: string;
  scopeSummary: string;
  validityDays: string;
  currency: string;
  lineItems: ProposalLineItem[];
}

export interface MilestoneWithDetails {
  id: string;
  projectId: string;
  proposalId: string | null;
  deliverableId: string | null;
  deliverableTitle?: string | null;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  triggerType: "upfront" | "on_approval" | "on_date" | "manual";
  dueDate: Date | string | null;
  status: "upcoming" | "due" | "overdue" | "paid" | "waived";
  createdAt: Date | string;
}

export interface PaymentRecord {
  id: string;
  milestoneId?: string | null;
  invoiceId?: string | null;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  referenceNote?: string | null;
  status: string;
  paidAt: Date | string | null;
}

export interface DeliverableItem {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: "pending" | "in_review" | "approved" | "revision_requested";
  submissionTitle: string | null;
  submissionUrl: string | null;
  submissionNote: string | null;
  dueDate: Date | string | null;
  createdBy: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CommentItem {
  comment: {
    id: string;
    projectId: string;
    deliverableId: string | null;
    userId: string | null;
    body: string;
    createdAt: Date | string;
  };
  author: {
    id: string;
    name: string;
    image: string | null;
  } | null;
}
