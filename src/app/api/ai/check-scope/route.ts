import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getProjectAccess } from "@/lib/project-auth";
import { evaluateScopeStatus } from "@/lib/ai/scope-guardian";
import { z } from "zod";

const requestSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  currentRevision: z.number().int().positive("currentRevision must be a positive integer"),
});

/**
 * POST /api/ai/check-scope
 *
 * Evaluates whether a revision request constitutes scope creep
 * by comparing against AI-extracted contract revision limits.
 *
 * Body: { projectId: string, currentRevision: number }
 */
export async function POST(req: NextRequest) {
  try {
    // --- Auth ---
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Validate body ---
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { projectId, currentRevision } = parsed.data;

    // --- Authorization ---
    const { isAuthorized } = await getProjectAccess(projectId, session.user.id);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // --- Evaluate scope ---
    const evaluation = await evaluateScopeStatus(projectId, currentRevision);

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("[AI Check Scope]", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
