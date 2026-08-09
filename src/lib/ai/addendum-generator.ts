import { generateStructuredWithFallback } from "./client";
import { addendumSchema, type Addendum } from "./schemas";
import { db } from "@/utils/db";
import { contractScopeTerm, contract } from "@/db/schema";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a professional contract addendum writer.

Return a JSON object conforming EXACTLY to this structure:
{
  "title": "Addendum #1 — Extra Revision Round",
  "summary": "Brief explanation of why this addendum is needed",
  "additionalPrice": 5000,
  "currency": "INR",
  "lineItems": [
    { "description": "Additional UI Design Revision Round #3", "amount": 5000 }
  ]
}

Rules:
- Use exact keys: "title", "summary", "additionalPrice", "currency", "lineItems".
- "additionalPrice" MUST match the sum of "lineItems" amounts.
- Use professional business language.`;

// ---------------------------------------------------------------------------
// Addendum generation
// ---------------------------------------------------------------------------

/**
 * Generates a structured Change Order / Addendum using AI.
 *
 * Fetches the existing scope terms for the contract from the DB, then asks
 * the AI to draft an addendum based on the scope creep reason.
 *
 * @param contractId - The contract this addendum relates to.
 * @param reason     - Human-readable description of why additional work is needed.
 * @returns Structured Addendum object with title, line items, and pricing.
 */
export async function generateChangeOrderAddendum(
  contractId: string,
  reason: string,
): Promise<Addendum> {
  // Fetch existing scope terms for context
  const existingTerms = await db
    .select()
    .from(contractScopeTerm)
    .where(eq(contractScopeTerm.contractId, contractId));

  // Fetch contract details for currency context
  const [contractRow] = await db
    .select()
    .from(contract)
    .where(eq(contract.id, contractId));

  const scopeContext =
    existingTerms.length > 0
      ? existingTerms
          .map(
            (t) =>
              `- [${t.termType}] ${t.title}: ${t.description ?? "No description"}${t.maxRevisions !== null ? ` (max ${t.maxRevisions} revisions)` : ""}`,
          )
          .join("\n")
      : "No previously extracted scope terms found.";

  const prompt = `Original contract scope terms:
${scopeContext}

Reason for change order:
${reason}

Contract document: ${contractRow?.fileName ?? "Unknown"}

Generate a professional addendum for this change order.`;

  return generateStructuredWithFallback<Addendum>({
    schema: addendumSchema,
    system: SYSTEM_PROMPT,
    prompt: `${prompt}\n\nReturn response in JSON format.`,
  });
}
