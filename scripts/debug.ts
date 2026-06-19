import "dotenv/config";
import { db } from "../src/utils/db";
import { deliverable, projectMember, project, user } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const projectId = "0fc33b24-d640-4429-842c-b303bf3695f4";
  
  const proj = await db.select().from(project).where(eq(project.id, projectId));
  console.log("Project Status:", proj[0]?.status);
  
  const members = await db.select().from(projectMember).where(eq(projectMember.projectId, projectId));
  console.log("Members:", members.map(m => ({ userId: m.userId, role: m.role })));

  const deliverables = await db.select().from(deliverable).where(eq(deliverable.projectId, projectId));
  console.log("Deliverables:", deliverables.map(d => ({ title: d.title, status: d.status })));
  
  const hasDeliverables = deliverables.length > 0;
  const allApproved = hasDeliverables && deliverables.every(d => d.status === 'approved');
  
  console.log("hasDeliverables:", hasDeliverables);
  console.log("allApproved:", allApproved);
}

run().catch(console.error).finally(() => process.exit(0));
