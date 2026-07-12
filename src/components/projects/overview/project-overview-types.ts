export type ProjectMemberSummary = {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

export type ProjectDeliverableSummary = {
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type ProjectFileSummary = {
  id: string;
  createdAt: Date | string;
};

export type ProjectContractSummary = {
  id: string;
  status: string | null;
  createdAt: Date | string;
};

export type ProjectOverviewData = {
  id: string;
  name: string;
  status: string;
  createdAt: Date | string;
  members: ProjectMemberSummary[];
  deliverables: ProjectDeliverableSummary[];
  files: ProjectFileSummary[];
  contracts: ProjectContractSummary[];
};

export type ProjectActivityItem = {
  id: string;
  type: string;
  createdAt: Date | string;
  userId: string | null;
};
