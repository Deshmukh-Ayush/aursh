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
  | "comment_added";

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
