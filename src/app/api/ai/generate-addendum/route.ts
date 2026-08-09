import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/utils/db";
import { contract } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getProjectAccess } from "@/lib/project-auth";
import { generateChangeOrderAddendum } from "@/lib/ai/addendum-generator";
import { z } from "zod";

const requestSchema = z.object({
  contractId: z.string().min(1, "contractId is required"),
  reason: z.string().min(5, "reason must be at least 5 characters"),
});

/**
 * POST /api/ai/generate-addendum
 *
 * Generates a structured Change Order / Addendum using AI,
 * based on the contract's scope terms and a provided reason.
 *
 * Body: { contractId: string, reason: string }
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

    const { contractId, reason } = parsed.data;

    // --- Fetch contract for project ID ---
    const [contractRow] = await db
      .select()
      .from(contract)
      .where(eq(contract.id, contractId));

    if (!contractRow) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 },
      );
    }

    // --- Authorization ---
    const { isAuthorized } = await getProjectAccess(
      contractRow.projectId,
      session.user.id,
    );
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // --- Generate addendum ---
    const addendum = await generateChangeOrderAddendum(contractId, reason);

    return NextResponse.json({ success: true, addendum });
  } catch (error) {
    console.error("[AI Generate Addendum]", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
