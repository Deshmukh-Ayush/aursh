import type { MilestoneWithDetails, PaymentRecord } from "@/store/types";

export type { MilestoneWithDetails, PaymentRecord } from "@/store/types";

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
