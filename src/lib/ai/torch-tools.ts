import { tool } from "ai";
import { z } from "zod";
import { db } from "@/utils/db";
import {
  project,
  deliverable,
  proposal,
  contract,
  paymentMilestone,
  activityLog,
  user as userTable,
} from "@/db/schema";
import { eq, inArray, desc, and } from "drizzle-orm";
import { evaluateScopeStatus, getProjectRevisionCount } from "./scope-guardian";
import { generateChangeOrderAddendum } from "./addendum-generator";
import { getContractScopeFromDb } from "./contract-parser";

/**
 * Torch Tool Registry
 *
 * Exposes workspace intelligence, scope guardian audits, change order addenda,
 * proposal estimation, and financial analytics directly to Torch agent.
 */
export function createTorchTools(organizationId: string) {
  return {
    queryWorkspaceOverview: tool({
      description:
        "Fetches a high-level summary of active projects, deliverables in review, proposals, and contracts in the workspace.",
      inputSchema: z.object({}),
      execute: async () => {
        const orgProjects = await db
          .select({
            id: project.id,
            name: project.name,
            status: project.status,
            createdAt: project.createdAt,
          })
          .from(project)
          .where(eq(project.organizationId, organizationId));

        const projectIds = orgProjects.map((p) => p.id);
        if (projectIds.length === 0) {
          return {
            totalProjects: 0,
            activeProjects: 0,
            projects: [],
            inReviewDeliverablesCount: 0,
            totalProposalPipeline: 0,
          };
        }

        const [deliverablesList, proposalsList, contractsList] = await Promise.all([
          db
            .select({
              id: deliverable.id,
              projectId: deliverable.projectId,
              title: deliverable.title,
              status: deliverable.status,
              dueDate: deliverable.dueDate,
            })
            .from(deliverable)
            .where(inArray(deliverable.projectId, projectIds)),
          db
            .select({
              id: proposal.id,
              projectId: proposal.projectId,
              price: proposal.price,
              currency: proposal.currency,
              status: proposal.status,
            })
            .from(proposal)
            .where(inArray(proposal.projectId, projectIds)),
          db
            .select({
              id: contract.id,
              projectId: contract.projectId,
              status: contract.status,
              fileName: contract.fileName,
            })
            .from(contract)
            .where(inArray(contract.projectId, projectIds)),
        ]);

        const inReview = deliverablesList.filter(
          (d) => d.status === "in_review" || d.status === "revision_requested",
        );
        const acceptedValue = proposalsList
          .filter((p) => p.status === "accepted")
          .reduce((sum, p) => sum + p.price, 0);

        return {
          totalProjects: orgProjects.length,
          activeProjects: orgProjects.filter((p) => p.status === "active").length,
          projects: orgProjects.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            contractStatus:
              contractsList.find((c) => c.projectId === p.id)?.status || "none",
            deliverableCount: deliverablesList.filter((d) => d.projectId === p.id)
              .length,
          })),
          inReviewDeliverablesCount: inReview.length,
          inReviewDeliverables: inReview.map((d) => ({
            id: d.id,
            title: d.title,
            status: d.status,
            projectId: d.projectId,
          })),
          totalProposalPipeline: acceptedValue,
        };
      },
    }),

    auditProjectScope: tool({
      description:
        "Audits a project's revision history against signed contract scope terms, checking for scope creep, revision limits, and exclusions.",
      inputSchema: z.object({
        projectId: z.string().nullish().describe("The ID of the project to audit"),
        projectName: z
          .string()
          .nullish()
          .describe("Optional project name for fuzzy matching"),
      }),
      execute: async ({ projectId, projectName }) => {
        let targetId = projectId;

        if (!targetId && projectName) {
          const orgProjects = await db
            .select({ id: project.id, name: project.name })
            .from(project)
            .where(eq(project.organizationId, organizationId));
          const match = orgProjects.find((p) =>
            p.name.toLowerCase().includes(projectName.toLowerCase()),
          );
          targetId = match?.id;
        }

        if (!targetId) {
          const [firstProj] = await db
            .select({ id: project.id })
            .from(project)
            .where(eq(project.organizationId, organizationId))
            .limit(1);
          targetId = firstProj?.id;
        }

        if (!targetId) {
          return { error: `No projects found in current workspace.` };
        }

        const [proj] = await db
          .select()
          .from(project)
          .where(and(eq(project.id, targetId), eq(project.organizationId, organizationId)));

        if (!proj) {
          return { error: `Project not found in current organization.` };
        }

        const [activeContract] = await db
          .select()
          .from(contract)
          .where(and(eq(contract.projectId, targetId), eq(contract.status, "signed")))
          .orderBy(desc(contract.createdAt))
          .limit(1);

        const revisionCount = await getProjectRevisionCount(targetId);
        const scopeEvaluation = await evaluateScopeStatus(targetId, revisionCount + 1);
        const contractTerms = activeContract
          ? await getContractScopeFromDb(activeContract.id)
          : null;

        const deliverablesList = await db
          .select({
            id: deliverable.id,
            title: deliverable.title,
            status: deliverable.status,
          })
          .from(deliverable)
          .where(eq(deliverable.projectId, targetId));

        return {
          projectId: targetId,
          projectName: proj.name,
          hasSignedContract: !!activeContract,
          contractFileName: activeContract?.fileName || null,
          contractId: activeContract?.id || null,
          totalDeliverables: deliverablesList.length,
          deliverables: deliverablesList,
          historicalRevisionRequestsCount: revisionCount,
          scopeEvaluation,
          extractedTerms: contractTerms,
        };
      },
    }),

    generateAddendumDraft: tool({
      description:
        "Generates a formal Change Order Addendum with itemized pricing when scope creep is detected or extra work is requested.",
      inputSchema: z.object({
        projectId: z.string().describe("The ID of the project"),
        reason: z.string().describe("The reason for the change order or extra revisions"),
      }),
      execute: async ({ projectId, reason }) => {
        const [activeContract] = await db
          .select()
          .from(contract)
          .where(eq(contract.projectId, projectId))
          .orderBy(desc(contract.createdAt))
          .limit(1);

        if (!activeContract) {
          return {
            error: "No contract found for this project to generate an addendum for.",
          };
        }

        const addendum = await generateChangeOrderAddendum(activeContract.id, reason);

        return {
          projectId,
          contractId: activeContract.id,
          artifactType: "change_order_addendum",
          addendum,
          requiresConfirmation: true,
        };
      },
    }),

    analyzeFinancials: tool({
      description:
        "Analyzes payment milestones, outstanding cashflow, and collected revenue across projects.",
      inputSchema: z.object({
        projectId: z.string().nullish().describe("Optional project ID to filter financials"),
      }),
      execute: async ({ projectId }) => {
        const orgProjects = await db
          .select({ id: project.id, name: project.name })
          .from(project)
          .where(eq(project.organizationId, organizationId));

        const projectIds = projectId && projectId.trim().length > 0
          ? [projectId]
          : orgProjects.map((p) => p.id);

        if (projectIds.length === 0) {
          return { collected: 0, due: 0, overdue: 0, upcoming: 0, milestones: [] };
        }

        const milestones = await db
          .select()
          .from(paymentMilestone)
          .where(inArray(paymentMilestone.projectId, projectIds));

        let collected = 0;
        let due = 0;
        let overdue = 0;
        let upcoming = 0;

        for (const m of milestones) {
          if (m.status === "paid") collected += m.amount;
          else if (m.status === "due") due += m.amount;
          else if (m.status === "overdue") overdue += m.amount;
          else if (m.status === "upcoming") upcoming += m.amount;
        }

        return {
          currency: milestones[0]?.currency || "USD",
          summary: { collected, due, overdue, upcoming },
          milestonesCount: milestones.length,
          milestones: milestones.map((m) => ({
            id: m.id,
            title: m.title,
            amount: m.amount,
            currency: m.currency,
            status: m.status,
            triggerType: m.triggerType,
            dueDate: m.dueDate,
          })),
        };
      },
    }),

    generateClientDigest: tool({
      description:
        "Inspects project deliverables and activity history to synthesize a professional weekly client progress update.",
      inputSchema: z.object({
        projectId: z.string().nullish().describe("The ID of the project to generate a digest for"),
        projectName: z.string().nullish().describe("Optional project name"),
      }),
      execute: async ({ projectId, projectName }) => {
        let targetId = projectId;

        if (!targetId && projectName) {
          const orgProjects = await db
            .select({ id: project.id, name: project.name })
            .from(project)
            .where(eq(project.organizationId, organizationId));
          const match = orgProjects.find((p) =>
            p.name.toLowerCase().includes(projectName.toLowerCase()),
          );
          targetId = match?.id;
        }

        if (!targetId) {
          const [firstProj] = await db
            .select({ id: project.id })
            .from(project)
            .where(eq(project.organizationId, organizationId))
            .limit(1);
          targetId = firstProj?.id;
        }

        if (!targetId) return { error: "No projects found in current workspace." };

        const [proj] = await db
          .select()
          .from(project)
          .where(and(eq(project.id, targetId), eq(project.organizationId, organizationId)));

        if (!proj) return { error: "Project not found." };

        const [deliverablesList, recentLogs] = await Promise.all([
          db.select().from(deliverable).where(eq(deliverable.projectId, targetId)),
          db
            .select({ log: activityLog, user: userTable })
            .from(activityLog)
            .leftJoin(userTable, eq(activityLog.userId, userTable.id))
            .where(eq(activityLog.projectId, targetId))
            .orderBy(desc(activityLog.createdAt))
            .limit(10),
        ]);

        const approved = deliverablesList.filter((d) => d.status === "approved");
        const inReview = deliverablesList.filter((d) => d.status === "in_review");
        const pending = deliverablesList.filter((d) => d.status === "pending");

        return {
          projectName: proj.name,
          deliverablesSummary: {
            approvedCount: approved.length,
            inReviewCount: inReview.length,
            pendingCount: pending.length,
            approvedItems: approved.map((d) => d.title),
            inReviewItems: inReview.map((d) => d.title),
            pendingItems: pending.map((d) => d.title),
          },
          recentActivityEvents: recentLogs.map((l) => ({
            type: l.log.type,
            actor: l.user?.name || "System",
            createdAt: l.log.createdAt,
          })),
        };
      },
    }),

    createDeliverableDraft: tool({
      description:
        "Drafts a new project deliverable with title, description, and due date. Returns a confirmation artifact before writing to DB.",
      inputSchema: z.object({
        projectId: z.string().describe("The project to add the deliverable to"),
        title: z.string().describe("Title of the deliverable"),
        description: z.string().nullish().describe("Description of scope"),
        dueDate: z.string().nullish().describe("ISO date string for due date"),
      }),
      execute: async ({ projectId, title, description, dueDate }) => {
        const [proj] = await db
          .select({ name: project.name })
          .from(project)
          .where(and(eq(project.id, projectId), eq(project.organizationId, organizationId)));

        if (!proj) return { error: "Project not found." };

        return {
          artifactType: "create_deliverable_confirmation",
          projectId,
          projectName: proj.name,
          draft: { title, description, dueDate },
          requiresConfirmation: true,
        };
      },
    }),
  };
}
