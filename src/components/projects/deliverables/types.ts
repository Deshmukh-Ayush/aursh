export type DeliverableItem = {
  id: string;
  createdAt: Date | string;
  dueDate?: Date | string | null;
  title: string;
  status: string;
  description?: string | null;
  position?: number | null;
  projectId?: string | null;
};

export type DeliverableComment = {
  id: string;
  comment: {
    deliverableId: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};
