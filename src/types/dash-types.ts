export type DashboardProjectStatus = "active" | "completed" | "draft" | "archived" | string;
export type DashboardContractStatus = "draft" | "pending_signature" | "signed" | string;
export type DashboardDeliverableStatus = "in_review" | "approved" | "draft" | "completed" | string;
export type DashboardInvitationStatus = "pending" | "accepted" | "declined" | string;
export type DashboardActivityLogType = "deliverable_created" | string;

export interface DashboardProject {
  id: string;
  name: string;
  description: string | null;
  organizationId: string | null;
  status: DashboardProjectStatus;
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DashboardProjectInvitation {
  id: string;
  status: DashboardInvitationStatus;
  createdAt: Date | string;
}

export interface DashboardProjectContract {
  id: string;
  status: DashboardContractStatus;
  createdAt: Date | string;
}

export interface DashboardDeliverable {
  id: string;
  status: DashboardDeliverableStatus;
  createdAt: Date | string;
}

export interface DashboardActivityLog {
  id: string;
  type: DashboardActivityLogType;
  createdAt: Date | string;
}

export interface DashboardAgencyProject {
  proj: DashboardProject;
  invitations: DashboardProjectInvitation[];
  contracts: DashboardProjectContract[];
  deliverables: DashboardDeliverable[];
  activityLogs: DashboardActivityLog[];
}

export interface DashboardClientProject {
  proj: DashboardProject;
}

export interface DashboardActivityPoint {
  date: string;
  actions: number;
}

export interface DashboardNeedsAttentionItem {
  id: string;
  projectId: string;
  projectName: string;
  message: string;
  href: string;
}

export interface DashboardStats {
  totalActiveProjects: number;
  pendingSignatures: number;
  deliverablesAwaitingApproval: number;
  completedProjects: number;
  newProjectsThisWeek: number;
  newProjectsLastWeek: number;
  newDeliverablesThisWeek: number;
}