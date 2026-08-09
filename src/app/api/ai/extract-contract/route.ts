import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/utils/db";
import { contract } from "@/db/schema";
import { eq } from "drizzle-orm";
import { canManageProject, getProjectAccess } from "@/lib/project-auth";
import { extractAndSaveContractScope, getContractScopeFromDb } from "@/lib/ai/contract-parser";
import { aiRateLimiter, checkRateLimit } from "@/lib/ratelimit";
import { z } from "zod";

const extractSchema = z.object({ contractId: z.string().min(1) });

async function getAuthorizedContract(contractId: string, userId: string) {
  const [contractRow] = await db.select().from(contract).where(eq(contract.id, contractId));
  if (!contractRow) return { contractRow: null, access: null };
  const access = await getProjectAccess(contractRow.projectId, userId);
  return { contractRow, access };
}

/** Retrieves cached scope data. GET deliberately has no AI or database write side effect. */
export async function GET(req: NextRequest) {
  try {
    const contractId = new URL(req.url).searchParams.get("contractId");
    if (!contractId) return NextResponse.json({ error: "Contract ID is required" }, { status: 400 });
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { contractRow, access } = await getAuthorizedContract(contractId, session.user.id);
    if (!contractRow) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    if (!access?.isAuthorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const terms = await getContractScopeFromDb(contractId);
    return NextResponse.json({
      success: true,
      contractId,
      terms: terms ?? { scopeItems: [], exclusions: [], revisionLimits: [], paymentTerms: [] },
    });
  } catch (error) {
    console.error("[AI GET Contract Scope Error]", error);
    return NextResponse.json({ error: "Failed to fetch contract scope terms" }, { status: 500 });
  }
}

/** Extracts terms only from the exact document persisted for this contract. */
export async function POST(req: NextRequest) {
  try {
    const input = extractSchema.safeParse(await req.json());
    if (!input.success) return NextResponse.json({ error: input.error.issues[0].message }, { status: 400 });
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { contractRow, access } = await getAuthorizedContract(input.data.contractId, session.user.id);
    if (!contractRow) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    if (!access?.isAuthorized || !canManageProject(access.role)) {
      return NextResponse.json({ error: "Only the agency can extract contract scope" }, { status: 403 });
    }
    const rateLimitResult = await checkRateLimit(aiRateLimiter, `ai_extract_${session.user.id}`);
    if (!rateLimitResult.success) return NextResponse.json({ error: "Too many extraction requests. Please try again later." }, { status: 429 });

    const storedDocument = await get(contractRow.fileUrl, { access: "private", useCache: false });
    if (!storedDocument?.stream) return NextResponse.json({ error: "Contract file not found" }, { status: 404 });
    const documentBuffer = Buffer.from(await new Response(storedDocument.stream).arrayBuffer());
    const result = await extractAndSaveContractScope(contractRow.id, contractRow.projectId, documentBuffer);
    return NextResponse.json({ success: true, contractId: result.contractId, extractedCount: result.extractedCount, terms: result.terms });
  } catch (error) {
    console.error("[AI Extract Contract]", error);
    return NextResponse.json({ error: "Failed to extract contract scope" }, { status: 500 });
  }
}
