import { db } from "@/utils/db";
import { activityLog, project } from "@/db/schema";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { createNotification } from "./notifications";
import { sendActivityNotificationEmail } from "./email";

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
  | "comment_added"
  | "proposal_sent"
  | "proposal_accepted"
  | "proposal_declined";

interface LogActivityParams {
  projectId: string;
  userId: string;
  type: ActivityType;
  metadata?: Record<string, any>;
}

function getActivityMessage(type: ActivityType, metadata: any, actorName: string) {
  switch(type) {
    case "contract_uploaded": return `${actorName} uploaded a new contract: ${metadata.fileName || 'Document'}`;
    case "contract_signed": return metadata.fullySigned ? `The contract has been fully signed!` : `${actorName} signed the contract.`;
    case "file_uploaded": return `${actorName} uploaded a new file: ${metadata.fileName || 'File'}`;
    case "deliverable_created": return `${actorName} created a new deliverable: ${metadata.title || 'Task'}`;
    case "deliverable_in_review": return `${actorName} submitted a deliverable for review: ${metadata.title || 'Task'}`;
    case "deliverable_approved": return `${actorName} approved the deliverable: ${metadata.title || 'Task'}`;
    case "revision_requested": return `${actorName} requested a revision on: ${metadata.title || 'Task'}`;
    case "deliverable_completed": return `${actorName} completed a deliverable: ${metadata.title || 'Task'}`;
    case "project_completed": return `${actorName} marked the project as complete!`;
    case "member_joined": return `${actorName} joined the project.`;
    case "comment_added": return `${actorName} added a new comment.`;
    case "proposal_sent": return `${actorName} sent a proposal for review: ${metadata.title || 'Proposal'}`;
    case "proposal_accepted": return `${actorName} accepted the proposal: ${metadata.title || 'Proposal'}`;
    case "proposal_declined": return `${actorName} declined the proposal: ${metadata.title || 'Proposal'}`;
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

    // 4. Distribute to all other members
    const org = proj.organization;
    
    const notifications = proj.members
      .filter(m => m.userId !== userId) // Skip the actor
      .map(async (member) => {
        // In-app Notification
        await createNotification(
          member.userId,
          projectId,
          type as any,
          activityMessage
        );

        // Email Notification
        await sendActivityNotificationEmail(
          member.user.email,
          proj.name,
          activityMessage,
          projectId,
          org?.plan as any,
          org?.logoUrl,
          org?.brandColor
        );
      });

    await Promise.all(notifications);

  } catch (error) {
    console.error("Failed to log activity and dispatch notifications:", error);
    // We intentionally don't throw to avoid breaking the main user flow if logging fails
  }
}
