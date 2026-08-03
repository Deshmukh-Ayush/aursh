import { format, subDays } from "date-fns";
import type {
  DashboardActivityLog,
  DashboardActivityPoint,
  DashboardAgencyProject,
  DashboardNeedsAttentionItem,
  DashboardStats,
} from "@/types/dash-types";

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function getRelativeTime(date: Date | string) {
  const targetDate = toDate(date);
  const now = new Date();
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const daysDifference = Math.round((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (Math.abs(daysDifference) > 0) return rtf.format(daysDifference, "day");

  const hoursDifference = Math.round((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  if (Math.abs(hoursDifference) > 0) return rtf.format(hoursDifference, "hour");

  const minutesDifference = Math.round((targetDate.getTime() - now.getTime()) / (1000 * 60));
  return rtf.format(minutesDifference, "minute");
}

export function buildActivityTimeline(
  activityLogs: DashboardActivityLog[],
  days = 14,
  now = new Date(),
): DashboardActivityPoint[] {
  const activityData: DashboardActivityPoint[] = Array.from({ length: days }).map((_, i) => {
    const d = subDays(now, days - 1 - i);
    return {
      date: format(d, "MMM dd"),
      actions: 0,
    };
  });

  const lookup = new Map(activityData.map((point) => [point.date, point]));

  for (const log of activityLogs) {
    const logDate = format(toDate(log.createdAt), "MMM dd");
    const dayPoint = lookup.get(logDate);
    if (dayPoint) {
      dayPoint.actions += 1;
    }
  }

  return activityData;
}

export function calculateDashboardStats(
  projects: DashboardAgencyProject[],
  activityLogs: DashboardActivityLog[] = [],
  now = new Date(),
): DashboardStats {
  const sevenDaysAgo = subDays(now, 7);
  const fourteenDaysAgo = subDays(now, 14);

  const activeProjects = projects.filter((p) => p.proj.status === "active");

  const totalActiveProjects = activeProjects.length;
  const pendingSignatures = projects.filter((p) =>
    p.contracts.some((c) => c.status === "pending_signature"),
  ).length;

  const deliverablesAwaitingApproval = projects.reduce(
    (acc, p) => acc + p.deliverables.filter((d) => d.status === "in_review").length,
    0,
  );

  const completedProjects = projects.filter((p) => p.proj.status === "completed").length;

  const newProjectsThisWeek = activeProjects.filter(
    (p) => toDate(p.proj.createdAt) >= sevenDaysAgo,
  ).length;

  const newProjectsLastWeek = activeProjects.filter((p) => {
    const createdAt = toDate(p.proj.createdAt);
    return createdAt >= fourteenDaysAgo && createdAt < sevenDaysAgo;
  }).length;

  const newDeliverablesThisWeek = activityLogs.filter(
    (log) => log.type === "deliverable_created" && toDate(log.createdAt) >= sevenDaysAgo,
  ).length;

  return {
    totalActiveProjects,
    pendingSignatures,
    deliverablesAwaitingApproval,
    completedProjects,
    newProjectsThisWeek,
    newProjectsLastWeek,
    newDeliverablesThisWeek,
  };
}

export function buildNeedsAttention(
  projects: DashboardAgencyProject[],
): DashboardNeedsAttentionItem[] {
  const needsAttention: DashboardNeedsAttentionItem[] = [];

  for (const p of projects) {
    if (p.contracts.some((c) => c.status === "draft" || c.status === "pending_signature")) {
      needsAttention.push({
        id: `c-${p.proj.id}`,
        projectId: p.proj.id,
        projectName: p.proj.name,
        message: "Contract unsigned",
        href: `/projects/${p.proj.id}/contract`,
      });
    }

    const inReviewCount = p.deliverables.filter((d) => d.status === "in_review").length;
    if (inReviewCount > 0) {
      needsAttention.push({
        id: `d-${p.proj.id}`,
        projectId: p.proj.id,
        projectName: p.proj.name,
        message: `${inReviewCount} deliverable(s) awaiting approval`,
        href: `/projects/${p.proj.id}/deliverables`,
      });
    }

    if (p.invitations.some((i) => i.status === "pending")) {
      needsAttention.push({
        id: `i-${p.proj.id}`,
        projectId: p.proj.id,
        projectName: p.proj.name,
        message: "Client invite pending",
        href: `/projects/${p.proj.id}`,
      });
    }
  }

  return needsAttention;
}