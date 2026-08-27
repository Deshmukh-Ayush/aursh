import { generateStructuredWithFallback } from "./client";
import { contractScopeSchema, type ContractScope } from "./schemas";
import { extractPdfText, extractPdfTextFromUrl } from "./pdf-extractor";
import { db } from "@/utils/db";
import { contractScopeTerm } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_TEXT_LENGTH = 30_000; // Groq context window safety margin

const SYSTEM_PROMPT = `You are a contract analysis expert. Extract structured scope information from a Statement of Work (SOW), contract, or agreement.

Return a JSON object conforming EXACTLY to this structure:
{
  "scopeItems": [ { "title": "...", "description": "..." } ],
  "exclusions": [ { "title": "...", "description": "..." } ],
  "revisionLimits": [ { "title": "...", "maxRevisions": 2, "description": "..." } ],
  "paymentTerms": [ { "title": "...", "description": "..." } ]
}

Rules:
- Use "title" (not "name") as the key for item names.
- "revisionLimits" MUST be an array of objects, each containing "title" and integer "maxRevisions".
- Only extract information explicitly stated in the document.
- If a category has no items, return an empty array.
- Keep titles concise (under 10 words) and descriptions as one sentence.`;

// ---------------------------------------------------------------------------
// Core extraction function
// ---------------------------------------------------------------------------

/**
 * Parses contract text using Groq AI and returns structured scope data.
 *
 * @param pdfText - Plain text extracted from the contract PDF.
 * @returns Parsed ContractScope object with scope items, exclusions, revision limits, and payment terms.
 */
export async function parseContractScope(
  pdfText: string,
): Promise<ContractScope> {
  const truncatedText =
    pdfText.length > MAX_TEXT_LENGTH
      ? pdfText.slice(0, MAX_TEXT_LENGTH) + "\n\n[... document truncated for processing]"
      : pdfText;

  return generateStructuredWithFallback<ContractScope>({
    schema: contractScopeSchema,
    system: SYSTEM_PROMPT,
    prompt: `Analyze this contract document and extract all scope terms in JSON format:\n\n${truncatedText}`,
  });
}

// ---------------------------------------------------------------------------
// Full pipeline: extract PDF text → parse with AI → save to DB
// ---------------------------------------------------------------------------

export interface ExtractionResult {
  contractId: string;
  extractedCount: number;
  terms: ContractScope;
}

/**
 * End-to-end contract scope extraction pipeline.
 *
 * 1. Extracts text from the contract PDF (by URL or buffer).
 * 2. Sends text to Groq AI for structured parsing.
 * 3. Persists extracted terms to the `contract_scope_term` database table.
 * 4. Returns the extraction result.
 *
 * @param contractId - Database ID of the contract.
 * @param projectId  - Database ID of the project.
 * @param source     - Either a public URL string or a Buffer/Uint8Array of the PDF.
 */
export async function extractAndSaveContractScope(
  contractId: string,
  projectId: string,
  source: string | Buffer | Uint8Array | ArrayBuffer,
): Promise<ExtractionResult> {
  // Step 1: Extract text
  const { text } =
    typeof source === "string"
      ? await extractPdfTextFromUrl(source)
      : await extractPdfText(source);

  if (!text || text.length < 50) {
    throw new Error(
      "Extracted text is too short — the PDF may be image-based or empty. Please upload a text-based PDF.",
    );
  }

  // Step 2: Parse with AI
  const terms = await parseContractScope(text);

  // Step 3: Clear previous extractions for this contract (idempotent re-runs)
  await db
    .delete(contractScopeTerm)
    .where(eq(contractScopeTerm.contractId, contractId));

  // Step 4: Build insert rows
  const rows = [
    ...terms.scopeItems.map((item) => ({
      id: crypto.randomUUID(),
      contractId,
      projectId,
      termType: "scope" as const,
      title: item.title,
      description: item.description,
      maxRevisions: null,
    })),
    ...terms.exclusions.map((item) => ({
      id: crypto.randomUUID(),
      contractId,
      projectId,
      termType: "exclusion" as const,
      title: item.title,
      description: item.description,
      maxRevisions: null,
    })),
    ...terms.revisionLimits.map((item) => ({
      id: crypto.randomUUID(),
      contractId,
      projectId,
      termType: "revision_limit" as const,
      title: item.title,
      description: item.description ?? null,
      maxRevisions: item.maxRevisions,
    })),
    ...terms.paymentTerms.map((item) => ({
      id: crypto.randomUUID(),
      contractId,
      projectId,
      termType: "payment_term" as const,
      title: item.title,
      description: item.description,
      maxRevisions: null,
    })),
  ];

  // Step 5: Batch insert
  if (rows.length > 0) {
    await db.insert(contractScopeTerm).values(rows);
  }

  return {
    contractId,
    extractedCount: rows.length,
    terms,
  };
}

/**
 * Retrieves stored contract scope terms from DB for a given contract.
 */
export async function getContractScopeFromDb(
  contractId: string,
): Promise<ContractScope | null> {
  const terms = await db
    .select()
    .from(contractScopeTerm)
    .where(eq(contractScopeTerm.contractId, contractId));

  if (!terms || terms.length === 0) return null;

  return {
    scopeItems: terms
      .filter((t) => t.termType === "scope")
      .map((t) => ({ title: t.title, description: t.description || "" })),
    exclusions: terms
      .filter((t) => t.termType === "exclusion")
      .map((t) => ({ title: t.title, description: t.description || "" })),
    revisionLimits: terms
      .filter((t) => t.termType === "revision_limit")
      .map((t) => ({
        title: t.title,
        maxRevisions: t.maxRevisions ?? 1,
        description: t.description || undefined,
      })),
    paymentTerms: terms
      .filter((t) => t.termType === "payment_term")
      .map((t) => ({ title: t.title, description: t.description || "" })),
  };
}
