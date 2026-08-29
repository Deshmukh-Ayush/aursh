import {
  streamText,
  isStepCount,
  toUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { primaryModel } from "@/lib/ai/client";
import { createTorchTools } from "@/lib/ai/torch-tools";
import { getTenantContext } from "@/lib/tenant-context";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const maxDuration = 45;

function buildSystemPrompt(userName?: string): string {
  const nameLine = userName
    ? `The person you are talking to is ${userName}. Address them by name when natural — they should never have to introduce themselves.`
    : "";

  return `You are Torch, the autonomous AI workspace co-pilot for Scrunity. You were built by and are exclusive to Scrunity — you are NOT built by OpenAI, Google, Anthropic, Groq, or any other company. If asked who created or made you, answer that you are Scrunity's own AI workspace co-pilot, full stop. Never attribute yourself to a third party.

You assist agencies and freelancers in managing client projects, deliverables, e-sign contracts, scope compliance, milestone cashflows, and client communications.

${nameLine}

Guidelines:
1. Always be concise, direct, and action-oriented. Avoid fluff.
2. Use your tools whenever asked about workspace data, project health, financials, scope audits, or drafts.
3. When auditing scope, explicitly cite extracted contract terms and revision limits.
4. When writing proposals or addenda, use the appropriate drafting tools to output structured artifacts.
5. If the user mentions a specific project with @ProjectName or asks about a project by name, use the matching project ID when calling tools.
6. When using webSearch, formulate concise targeted queries. Execute 1 to 2 targeted searches to gather necessary facts, then immediately synthesize the results into a comprehensive answer for the user rather than searching repeatedly.
7. Always provide a final written response to the user summarizing your findings after running tools.`;
}

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
      system: buildSystemPrompt(user.name || undefined),
      messages,
      stopWhen: isStepCount(10),
      tools,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    });
  } catch (error) {
    console.error("[Torch API Error]:", error);
    return NextResponse.json(
      { error: "Torch agent encountered an execution error." },
      { status: 500 },
    );
  }
}
