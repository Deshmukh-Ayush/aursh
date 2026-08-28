import { db } from "@/utils/db";
import { activityLog, project } from "@/db/schema";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { createNotification } from "./notifications";
import { sendActivityNotificationEmail } from "./email";
import { after } from "next/server";

type ActivityType = 
  | "contract_uploaded" 
  | "contract_signed" 
  | "file_uploaded" 
  | "deliverable_created" 
  | "deliverable_approved" 
  | "revision_requested" 
  | "deliverable_completed" 
  | "project_completed" 
  | "member_joined"
  | "deliverable_in_review"
  | "deliverable_reconciled"
  | "comment_added"
  | "proposal_sent"
  | "proposal_accepted"
  | "proposal_declined"
  | "payment_requested"
  | "payment_completed"
  | "payment_overdue"
  | "milestone_created"
  | "invoice_sent"
  | "invoice_paid"
  | "invoice_viewed";

interface LogActivityParams {
  projectId: string;
  userId?: string | null;
  type: ActivityType;
  metadata?: Record<string, unknown>;
}

function getActivityMessage(type: ActivityType, metadata: Record<string, unknown>, actorName: string) {
  const value = (key: string, fallback: string): string => {
    const item = metadata[key];
    return typeof item === "string" && item.length > 0 ? item : fallback;
  };

  switch(type) {
    case "contract_uploaded": return `${actorName} uploaded a new contract: ${value("fileName", "Document")}`;
    case "contract_signed": return metadata.fullySigned ? `The contract has been fully signed!` : `${actorName} signed the contract.`;
    case "file_uploaded": return `${actorName} uploaded a new file: ${value("fileName", "File")}`;
    case "deliverable_created": return `${actorName} created a new deliverable: ${value("title", "Task")}`;
    case "deliverable_in_review": return `${actorName} submitted a deliverable for review: ${value("title", "Task")}`;
    case "deliverable_approved": return `${actorName} approved the deliverable: ${value("title", "Task")}`;
    case "revision_requested": return `${actorName} requested a revision on: ${value("title", "Task")}`;
    case "deliverable_completed": return `${actorName} completed a deliverable: ${value("title", "Task")}`;
    case "deliverable_reconciled": return `Deliverable "${value("title", "Task")}" scope terms reconciled with signed contract.`;
    case "project_completed": return `${actorName} marked the project as complete!`;
    case "member_joined": return `${actorName} joined the project.`;
    case "comment_added": return `${actorName} added a new comment.`;
    case "proposal_sent": return `${actorName} sent a proposal for review: ${value("title", "Proposal")}`;
    case "proposal_accepted": return `${actorName} accepted the proposal: ${value("title", "Proposal")}`;
    case "proposal_declined": return `${actorName} declined the proposal: ${value("title", "Proposal")}`;
    case "payment_requested": return `${actorName} requested a payment milestone: ${value("milestoneTitle", "Milestone")}`;
    case "payment_completed": return `${actorName} completed payment for: ${value("milestoneTitle", "Milestone")}`;
    case "payment_overdue": return `Payment milestone is overdue: ${value("milestoneTitle", "Milestone")}`;
    case "milestone_created": return `${actorName} created a new payment milestone: ${value("milestoneTitle", "Milestone")}`;
    case "invoice_sent": return `${actorName} sent invoice ${value("invoiceNumber", "Invoice")}`;
    case "invoice_paid": return `Invoice ${value("invoiceNumber", "Invoice")} has been marked as paid.`;
    case "invoice_viewed": return `${actorName} viewed invoice ${value("invoiceNumber", "Invoice")}.`;
    default: return `${actorName} updated the project.`;
  }
}

export async function logActivity({ projectId, userId, type, metadata = {} }: LogActivityParams) {
  try {
    // 1. Log the activity itself
    await db.insert(activityLog).values({
      id: crypto.randomUUID(),
      projectId,
      userId,
      type,
      metadata,
    });

    // 2. Fetch project context
    const proj = await db.query.project.findFirst({
      where: eq(project.id, projectId),
      with: {
        organization: true,
        members: {
          with: { user: true }
        }
      }
    });

    if (!proj) return;

    // 3. Find actor
    const actor = proj.members.find(m => m.user.id === userId);
    const actorName = actor?.user.name || "Someone";
    const activityMessage = getActivityMessage(type, metadata, actorName);

    // 4. Distribute to all other members asynchronously (Non-blocking)
    const org = proj.organization;
    
    const dispatchNotifications = async () => {
      const results = await Promise.allSettled(
        proj.members
          .filter(m => m.userId !== userId)
          .map(async (projMember) => {
            await createNotification(
              projMember.userId,
              projectId,
              type,
              activityMessage
            );
            await sendActivityNotificationEmail(
              projMember.user.email,
              proj.name,
              activityMessage,
              projectId,
              org?.plan as "free" | "freelancer" | "agency" | undefined,
              org?.logoUrl
            );
          })
      );
      for (const result of results) {
        if (result.status === "rejected") {
          console.error("Notification delivery failed:", result.reason);
        }
      }
    };

    // Use Next.js `after()` in request scope, or execute directly in test/worker contexts
    try {
      after(dispatchNotifications);
    } catch {
      dispatchNotifications().catch(() => {});
    }

  } catch (error) {
    console.error("Failed to log activity:", error);
    // We intentionally don't throw to avoid breaking the main user flow if logging fails
  }
}
