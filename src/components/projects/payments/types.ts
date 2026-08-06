export type MilestoneWithDetails = {
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
  dueDate: Date | null;
  status: "upcoming" | "due" | "overdue" | "paid" | "waived";
  createdAt: Date;
};

export type PaymentRecord = {
  id: string;
  milestoneId: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  referenceNote?: string | null;
  status: string;
  paidAt: Date | null;
};

export type PaymentsViewClientProps = {
  projectId: string;
  milestones: MilestoneWithDetails[];
  payments: PaymentRecord[];
  currentUserId: string;
  userRole: "owner" | "agency" | "client";
  deliverablesList: Array<{ id: string; title: string }>;
};

export type PaymentsTabKey = "all" | "due" | "paid" | "upcoming";

export type PaymentsTab = {
  id: PaymentsTabKey;
  label: string;
};
