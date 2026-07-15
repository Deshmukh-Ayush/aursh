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
  comment: {
    id: string;
    body: string;
    createdAt: Date;
    userId: string;
    deliverableId: string | null;
    projectId: string;
  };
  author: {
    name: string;
    image: string | null;
  } | null;
};
