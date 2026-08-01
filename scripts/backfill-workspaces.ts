import { db } from "../src/utils/db";
import { organization, workspace, project } from "../src/db/schema";
import { eq, isNull } from "drizzle-orm";
import crypto from "crypto";

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function migrate() {
  console.log("Starting workspace backfill migration...");

  // 1. Get all organizations
  const orgs = await db.select().from(organization);
  console.log(`Found ${orgs.length} organizations.`);

  for (const org of orgs) {
    // Check if this org has any workspaces
    const orgWorkspaces = await db.select().from(workspace).where(eq(workspace.organizationId, org.id));
    
    let defaultWorkspaceId = orgWorkspaces[0]?.id;

    if (!defaultWorkspaceId) {
      // Create a default workspace for this organization
      const workspaceName = `${org.name} Workspace`;
      defaultWorkspaceId = crypto.randomUUID();
      const slug = generateSlug(workspaceName);

      await db.insert(workspace).values({
        id: defaultWorkspaceId,
        name: workspaceName,
        slug: slug,
        organizationId: org.id,
      });

      console.log(`Created default workspace "${workspaceName}" for organization "${org.name}".`);
    }

    // Assign all unassigned projects in this organization to this workspace
    const unassignedProjects = await db.select().from(project).where(
      eq(project.organizationId, org.id)
    );

    let updatedCount = 0;
    for (const proj of unassignedProjects) {
      if (!proj.workspaceId) {
        await db.update(project).set({ workspaceId: defaultWorkspaceId }).where(eq(project.id, proj.id));
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`Migrated ${updatedCount} projects to workspace ${defaultWorkspaceId} for org ${org.name}`);
    }
  }

  console.log("Migration completed successfully.");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
