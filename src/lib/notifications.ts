import { db } from "@/utils/db";
import { notification } from "@/db/schema";
import { nanoid } from "nanoid";

export type NotificationType = 
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

export async function createNotification(
  userId: string,
  projectId: string,
  type: NotificationType,
  message: string
) {
  try {
    await db.insert(notification).values({
      id: nanoid(),
      userId,
      projectId,
      type,
      message,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
