import { db } from "@/utils/db";
import { activityLog } from "@/db/schema";
import crypto from "crypto";

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
  | "deliverable_in_review";

interface LogActivityParams {
  projectId: string;
  userId: string;
  type: ActivityType;
  metadata?: Record<string, any>;
}

export async function logActivity({ projectId, userId, type, metadata }: LogActivityParams) {
  try {
    await db.insert(activityLog).values({
      id: crypto.randomUUID(),
      projectId,
      userId,
      type,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // We intentionally don't throw to avoid breaking the main user flow if logging fails
  }
}
