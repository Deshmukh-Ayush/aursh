"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProposalTabKey = "all" | "draft" | "sent" | "accepted" | "declined";
export type PaymentsTabKey = "all" | "due" | "paid" | "upcoming";
export type DeliverableViewMode = "list" | "board";

interface UIState {
  // Proposal UI
  isProposalBuilderOpen: boolean;
  isProposalPreviewOpen: boolean;
  activeProposalTab: ProposalTabKey;
  
  // Payments UI
  isCreateMilestoneOpen: boolean;
  activePaymentTab: PaymentsTabKey;
  
  // Deliverables UI
  deliverableViewMode: DeliverableViewMode;
  
  // Actions
  setProposalBuilderOpen: (open: boolean) => void;
  setProposalPreviewOpen: (open: boolean) => void;
  setActiveProposalTab: (tab: ProposalTabKey) => void;
  
  setCreateMilestoneOpen: (open: boolean) => void;
  setActivePaymentTab: (tab: PaymentsTabKey) => void;
  
  setDeliverableViewMode: (mode: DeliverableViewMode) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Proposal UI initial
      isProposalBuilderOpen: false,
      isProposalPreviewOpen: false,
      activeProposalTab: "all",

      // Payments UI initial
      isCreateMilestoneOpen: false,
      activePaymentTab: "all",

      // Deliverables UI initial
      deliverableViewMode: "list",

      // Actions
      setProposalBuilderOpen: (open) => set({ isProposalBuilderOpen: open }),
      setProposalPreviewOpen: (open) => set({ isProposalPreviewOpen: open }),
      setActiveProposalTab: (tab) => set({ activeProposalTab: tab }),

      setCreateMilestoneOpen: (open) => set({ isCreateMilestoneOpen: open }),
      setActivePaymentTab: (tab) => set({ activePaymentTab: tab }),

      setDeliverableViewMode: (mode) => set({ deliverableViewMode: mode }),
    }),
    {
      name: "scrunity_ui_store",
      partialize: (state) => ({
        deliverableViewMode: state.deliverableViewMode,
      }),
    }
  )
);
