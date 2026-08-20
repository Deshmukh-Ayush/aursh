import { streamText } from "ai";
import { primaryModel } from "@/lib/ai/client";
import { createTorchTools } from "@/lib/ai/torch-tools";
import { getTenantContext } from "@/lib/tenant-context";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const maxDuration = 45;

const TORCH_SYSTEM_PROMPT = `You are Torch, the autonomous AI workspace co-pilot for Scrunity.
You assist agencies and freelancers in managing client projects, deliverables, e-sign contracts, scope compliance, milestone cashflows, and client communications.

Guidelines:
1. Always be concise, direct, and action-oriented. Avoid fluff.
2. Use your tools whenever asked about workspace data, project health, financials, scope audits, or drafts.
3. When auditing scope, explicitly cite extracted contract terms and revision limits.
4. When writing proposals or addenda, use the appropriate drafting tools to output structured artifacts.
5. If the user mentions a specific project with @ProjectName or asks about a project by name, use the matching project ID when calling tools.`;

export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const { user, organizationId } = await getTenantContext(reqHeaders);

    if (!user || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await req.json();

    const tools = createTorchTools(organizationId);

    const result = streamText({
      model: primaryModel,
      system: TORCH_SYSTEM_PROMPT,
      messages,
      maxSteps: 5,
      tools,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("[Torch API Error]:", error);
    return NextResponse.json(
      { error: "Torch agent encounter an execution error." },
      { status: 500 },
    );
  }
}
