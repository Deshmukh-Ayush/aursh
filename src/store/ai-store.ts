import { create } from "zustand";
import type { ContractScope } from "@/lib/ai/schemas";

export type AIDrawerTab = "scope" | "exclusions" | "revisions" | "payment";

interface AIStoreState {
  isOpen: boolean;
  activeContractId: string | null;
  activeContractName: string | null;
  activeTab: AIDrawerTab;
  terms: ContractScope | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  openDrawer: (contractId: string, contractName: string) => void;
  closeDrawer: () => void;
  setActiveTab: (tab: AIDrawerTab) => void;
  setTerms: (terms: ContractScope) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAIStore = create<AIStoreState>((set) => ({
  isOpen: false,
  activeContractId: null,
  activeContractName: null,
  activeTab: "scope",
  terms: null,
  isLoading: false,
  error: null,

  openDrawer: (contractId, contractName) =>
    set({
      isOpen: true,
      activeContractId: contractId,
      activeContractName: contractName,
      terms: null,
      error: null,
    }),

  closeDrawer: () =>
    set({
      isOpen: false,
      activeContractId: null,
      activeContractName: null,
    }),

  setActiveTab: (activeTab) => set({ activeTab }),

  setTerms: (terms) => set({ terms, isLoading: false, error: null }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),
}));
