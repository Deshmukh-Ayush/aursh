// Types shared across overview components.
// `server-serialization`: only the fields each component needs are included — no full DB rows.

export type OverviewMember = {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    image: string | null;
    email: string;
  };
};

export type OverviewDeliverable = {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_review" | "approved" | "revision_requested";
  dueDate: string | null;
  submissionTitle: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OverviewContract = {
  id: string;
  status: string;
  fileName: string;
  createdAt: string;
};

export type OverviewProposal = {
  id: string;
  title: string;
  price: number;
  currency: string;
  status: "draft" | "sent" | "accepted" | "declined";
  acceptedAt: string | null;
  createdAt: string;
};

export type OverviewActivity = {
  log: {
    id: string;
    type: string;
    metadata: Record<string, any> | null;
    createdAt: string;
  };
  actor: {
    id: string;
    name: string;
    image: string | null;
  } | null;
};

export type OverviewProject = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  members: OverviewMember[];
  deliverables: OverviewDeliverable[];
  contracts: OverviewContract[];
};
