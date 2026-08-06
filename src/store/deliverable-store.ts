"use client";

import { create } from "zustand";
import type { DeliverableItem } from "./types";

interface DeliverableState {
  items: DeliverableItem[];
  isDirty: boolean;
  isSaving: boolean;
  activeDragId: string | null;

  // Drawers / Dialogs
  revisionDialogOpen: boolean;
  revisionComment: string;
  pendingRevisionUpdate: { id: string; status: string } | null;

  submissionDrawerOpen: boolean;
  submissionTitle: string;
  submissionUrl: string;
  submissionNote: string;
  pendingSubmissionUpdate: { id: string; status: string } | null;

  editDialogOpen: boolean;
  editingItem: DeliverableItem | null;

  // Actions
  setInitialItems: (items: DeliverableItem[]) => void;
  updateItemStatus: (id: string, newStatus: DeliverableItem["status"]) => void;
  updateItemDetails: (id: string, updates: Partial<DeliverableItem>) => void;
  setActiveDragId: (id: string | null) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsSaving: (saving: boolean) => void;

  setRevisionDialogOpen: (open: boolean) => void;
  setRevisionComment: (comment: string) => void;
  setPendingRevisionUpdate: (update: { id: string; status: string } | null) => void;

  setSubmissionDrawerOpen: (open: boolean) => void;
  setSubmissionTitle: (title: string) => void;
  setSubmissionUrl: (url: string) => void;
  setSubmissionNote: (note: string) => void;
  setPendingSubmissionUpdate: (update: { id: string; status: string } | null) => void;

  setEditDialogOpen: (open: boolean) => void;
  setEditingItem: (item: DeliverableItem | null) => void;
  resetDrawers: () => void;
}

export const useDeliverableStore = create<DeliverableState>((set) => ({
  items: [],
  isDirty: false,
  isSaving: false,
  activeDragId: null,

  revisionDialogOpen: false,
  revisionComment: "",
  pendingRevisionUpdate: null,

  submissionDrawerOpen: false,
  submissionTitle: "",
  submissionUrl: "",
  submissionNote: "",
  pendingSubmissionUpdate: null,

  editDialogOpen: false,
  editingItem: null,

  setInitialItems: (items) => set({ items, isDirty: false }),

  updateItemStatus: (id, newStatus) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, status: newStatus } : item)),
      isDirty: true,
    })),

  updateItemDetails: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
      isDirty: true,
    })),

  setActiveDragId: (activeDragId) => set({ activeDragId }),
  setIsDirty: (isDirty) => set({ isDirty }),
  setIsSaving: (isSaving) => set({ isSaving }),

  setRevisionDialogOpen: (revisionDialogOpen) => set({ revisionDialogOpen }),
  setRevisionComment: (revisionComment) => set({ revisionComment }),
  setPendingRevisionUpdate: (pendingRevisionUpdate) => set({ pendingRevisionUpdate }),

  setSubmissionDrawerOpen: (submissionDrawerOpen) => set({ submissionDrawerOpen }),
  setSubmissionTitle: (submissionTitle) => set({ submissionTitle }),
  setSubmissionUrl: (submissionUrl) => set({ submissionUrl }),
  setSubmissionNote: (submissionNote) => set({ submissionNote }),
  setPendingSubmissionUpdate: (pendingSubmissionUpdate) => set({ pendingSubmissionUpdate }),

  setEditDialogOpen: (editDialogOpen) => set({ editDialogOpen }),
  setEditingItem: (editingItem) => set({ editingItem }),

  resetDrawers: () =>
    set({
      revisionDialogOpen: false,
      revisionComment: "",
      pendingRevisionUpdate: null,
      submissionDrawerOpen: false,
      submissionTitle: "",
      submissionUrl: "",
      submissionNote: "",
      pendingSubmissionUpdate: null,
      editDialogOpen: false,
      editingItem: null,
    }),
}));
