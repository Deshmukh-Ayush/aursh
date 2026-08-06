"use client";

import { create } from "zustand";
import type { MilestoneWithDetails } from "./types";

interface PaymentState {
  // Confirm Payment Drawer State
  payModalMilestone: MilestoneWithDetails | null;
  selectedMethod: string;
  referenceNote: string;

  // Create Milestone Form State
  title: string;
  description: string;
  amount: string;
  currency: string;
  triggerType: string;
  selectedDeliverableId: string;
  dueDate: string;
  isSubmitting: boolean;

  // Actions
  setPayModalMilestone: (milestone: MilestoneWithDetails | null) => void;
  setSelectedMethod: (method: string) => void;
  setReferenceNote: (note: string) => void;

  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setAmount: (amount: string) => void;
  setCurrency: (currency: string) => void;
  setTriggerType: (triggerType: string) => void;
  setSelectedDeliverableId: (id: string) => void;
  setDueDate: (dueDate: string) => void;
  setIsSubmitting: (submitting: boolean) => void;

  resetCreateForm: () => void;
  resetConfirmForm: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  payModalMilestone: null,
  selectedMethod: "upi",
  referenceNote: "",

  title: "",
  description: "",
  amount: "",
  currency: "INR",
  triggerType: "manual",
  selectedDeliverableId: "",
  dueDate: "",
  isSubmitting: false,

  setPayModalMilestone: (milestone) => set({ payModalMilestone: milestone }),
  setSelectedMethod: (method) => set({ selectedMethod: method }),
  setReferenceNote: (note) => set({ referenceNote: note }),

  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setAmount: (amount) => set({ amount }),
  setCurrency: (currency) => set({ currency }),
  setTriggerType: (triggerType) => set({ triggerType }),
  setSelectedDeliverableId: (id) => set({ selectedDeliverableId: id }),
  setDueDate: (dueDate) => set({ dueDate }),
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),

  resetCreateForm: () =>
    set({
      title: "",
      description: "",
      amount: "",
      currency: "INR",
      triggerType: "manual",
      selectedDeliverableId: "",
      dueDate: "",
      isSubmitting: false,
    }),

  resetConfirmForm: () =>
    set({
      payModalMilestone: null,
      selectedMethod: "upi",
      referenceNote: "",
      isSubmitting: false,
    }),
}));
