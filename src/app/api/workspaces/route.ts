import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant-context";
import { db } from "@/utils/db";
import { workspace } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const workspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required"),
  slug: z.string().min(1, "Slug is required"),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req.headers);

    if (ctx.error) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status || 400 });
    }

    const workspaces = await db
      .select()
      .from(workspace)
      .where(eq(workspace.organizationId, ctx.organizationId));

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req.headers);

    if (ctx.error) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status || 400 });
    }

    const body = await req.json();
    const result = workspaceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, slug } = result.data;

    const [newWorkspace] = await db
      .insert(workspace)
      .values({
        id: crypto.randomUUID(),
        name,
        slug,
        organizationId: ctx.organizationId,
      })
      .returning();

    return NextResponse.json(newWorkspace);
  } catch (error) {
    console.error("Error creating workspace:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
