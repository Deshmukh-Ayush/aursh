/**
 * Standalone AI Backend Test Script
 *
 * Tests the AI contract parsing engine directly (no server, no auth).
 * Uses Primary (openai/gpt-oss-120b) with Fallback (llama-3.3-70b-versatile).
 * Run with: npx tsx scripts/test-ai-backend.ts
 *
 * Requirements:
 * - GROQ_API_KEY in .env (or exported in shell)
 */

import "dotenv/config";
import { generateStructuredWithFallback } from "../src/lib/ai/client";
import {
  contractScopeSchema,
  addendumSchema,
  type ContractScope,
  type Addendum,
} from "../src/lib/ai/schemas";

// ---------------------------------------------------------------------------
// Sample SOW text for testing
// ---------------------------------------------------------------------------

const SAMPLE_SOW_TEXT = `
STATEMENT OF WORK — Project Scrunity

1. SCOPE OF WORK

The Agency ("Provider") agrees to deliver the following to the Client:

1.1 Next.js Web Application — A full-stack web app built with Next.js 16,
    including authentication (Google OAuth), multi-tenant organization support,
    role-based access control, and responsive dashboard.

1.2 Payment Integration — Integration with Stripe payment gateway for
    milestone-based invoicing and payment tracking.

1.3 Contract Management Module — PDF upload, e-signing flow, and contract
    status tracking.

1.4 Deliverable Tracking System — CRUD for deliverables with status
    workflow (pending → in_review → approved/revision_requested).

2. EXCLUSIONS

The following items are explicitly OUT OF SCOPE:

2.1 Mobile Native Applications — No iOS or Android native app development.
2.2 Third-party API Integrations — Beyond Stripe, no external API work.
2.3 Content Creation — All copy, images, and assets to be provided by Client.

3. REVISION POLICY

3.1 Design Revisions — A maximum of 2 design revision rounds are included.
3.2 Development Revisions — A maximum of 3 code revision rounds are included.
    Additional revisions beyond these limits will be billed at ₹2,500/hour.

4. PAYMENT TERMS

4.1 Upfront Payment — 30% of total project value upon contract signing.
4.2 Milestone 1 — 30% upon delivery of authentication and dashboard modules.
4.3 Final Payment — 40% upon project completion and final approval.

Total Project Value: ₹2,50,000 INR
`;

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(60));
  console.log("  Scrunity AI Backend — Test Suite");
  console.log("=".repeat(60));

  if (!process.env.GROQ_API_KEY) {
    console.error("\n❌ GROQ_API_KEY is not set in .env");
    console.error("   Get a free key at: https://console.groq.com/");
    process.exit(1);
  }

  console.log("\n✅ GROQ_API_KEY detected");
  console.log("📡 Primary Model:  openai/gpt-oss-120b");
  console.log("🔄 Fallback Model: llama-3.3-70b-versatile\n");

  // ── Test 1: Contract Scope Extraction ──────────────────────────────────

  console.log("─".repeat(60));
  console.log("TEST 1: Contract Scope Extraction (Primary + Fallback)");
  console.log("─".repeat(60));

  try {
    const output = await generateStructuredWithFallback<ContractScope>({
      schema: contractScopeSchema,
      system: `You are a contract analysis expert. Extract structured scope information from a Statement of Work.
Return a JSON object with scopeItems, exclusions, revisionLimits, and paymentTerms.`,
      prompt: `Analyze this contract and extract all scope terms in JSON format:\n\n${SAMPLE_SOW_TEXT}`,
    });

    console.log(`\n✅ Extracted ${output.scopeItems.length} scope items:`);
    for (const item of output.scopeItems) {
      console.log(`   • ${item.title}: ${item.description}`);
    }

    console.log(`\n✅ Extracted ${output.exclusions.length} exclusions:`);
    for (const item of output.exclusions) {
      console.log(`   ✖ ${item.title}: ${item.description}`);
    }

    console.log(`\n✅ Extracted ${output.revisionLimits.length} revision limits:`);
    for (const item of output.revisionLimits) {
      console.log(`   ⚡ ${item.title}: max ${item.maxRevisions} revisions`);
    }

    console.log(`\n✅ Extracted ${output.paymentTerms.length} payment terms:`);
    for (const item of output.paymentTerms) {
      console.log(`   💰 ${item.title}: ${item.description}`);
    }

    // ── Test 2: Scope Creep Check (simulated) ────────────────────────────

    console.log("\n" + "─".repeat(60));
    console.log("TEST 2: Scope Creep Detection (Simulated)");
    console.log("─".repeat(60));

    const maxDesignRevisions =
      output.revisionLimits.find((r) =>
        r.title.toLowerCase().includes("design"),
      )?.maxRevisions ?? 2;

    // Simulate requesting revision #3
    const requestedRevision = 3;
    const isScopeCreep = requestedRevision > maxDesignRevisions;

    console.log(`\n   Max design revisions: ${maxDesignRevisions}`);
    console.log(`   Requested revision:   #${requestedRevision}`);
    console.log(
      `   Status: ${isScopeCreep ? "🔴 SCOPE CREEP ALERT" : "🟢 Within Scope"}`,
    );
    console.log(
      `   Message: ${isScopeCreep ? `Revision #${requestedRevision} exceeds contract limit of ${maxDesignRevisions}` : "Within scope"}`,
    );

    // ── Test 3: Addendum Generation ──────────────────────────────────────

    console.log("\n" + "─".repeat(60));
    console.log("TEST 3: AI Change Order / Addendum Generation (Primary + Fallback)");
    console.log("─".repeat(60));

    const scopeContext = output.revisionLimits
      .map(
        (r) => `- [revision_limit] ${r.title}: max ${r.maxRevisions} revisions`,
      )
      .join("\n");

    const addendum = await generateStructuredWithFallback<Addendum>({
      schema: addendumSchema,
      system: `You are a professional contract addendum writer. Generate a structured addendum for a change order. Use professional business language. Currency should be INR.`,
      prompt: `Original contract scope terms:\n${scopeContext}\n\nReason for change order:\nClient requested a 3rd round of UI design revisions, exceeding the 2-revision limit.\n\nGenerate a professional addendum in JSON format.`,
    });

    console.log(`\n✅ Addendum Generated:`);
    console.log(`   Title:    ${addendum.title}`);
    console.log(`   Summary:  ${addendum.summary}`);
    console.log(
      `   Price:    ${addendum.currency} ${addendum.additionalPrice.toLocaleString()}`,
    );
    console.log(`   Line Items:`);
    for (const item of addendum.lineItems) {
      console.log(`     - ${item.description}: ${addendum.currency} ${item.amount.toLocaleString()}`);
    }

    // ── Summary ──────────────────────────────────────────────────────────

    console.log("\n" + "=".repeat(60));
    console.log("  ✅ ALL TESTS PASSED");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

main();
