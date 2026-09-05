import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Section,
  H3,
  P,
  Code,
  CodeBlock,
  Table,
  Callout,
} from "../doc-components";

export const metadata: Metadata = {
  title: "Application Execution Architecture & Data Flow Map",
  description: "Comprehensive code audit, end-to-end execution funnels, API route specifications, database mutations, and system state flow for Scrunity.",
  robots: {
    index: false,
    follow: false,
  },
};

const DEVELOPER_EMAILS = [
  "losted710@gmail.com",
];

export default async function ExecutionDocsPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !DEVELOPER_EMAILS.includes(session.user.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-svh bg-background text-foreground antialiased font-sans selection:bg-brand/20">
      <style dangerouslySetInnerHTML={{__html: `
        html {
          scroll-behavior: smooth;
        }
      `}} />
      
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 h-13 px-6 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/docs" className="text-[13px] text-muted-foreground hover:text-foreground font-medium transition-colors">
            ← Back to Main Docs
          </Link>
          <span className="text-border/60">|</span>
          <span className="text-[14px] font-bold tracking-tight text-foreground">Scrunity Execution Architecture</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand tracking-wider uppercase">
            Full Codebase Audit
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono font-medium">v0.0.1</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-10 pb-32 space-y-10">
        {/* Hero Header */}
        <header className="mb-10">
          <h1 className="text-[36px] font-semibold tracking-tight leading-tight text-foreground mb-3 text-balance">
            Application Execution & Data Flow Architecture
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground max-w-3xl text-pretty">
            An exhaustive, code-level execution map derived directly from auditing the Scrunity codebase. Traces every user click, component invocation, HTTP route handler, database table mutation, and background serverless task.
          </p>
        </header>

        {/* Section Jump Bar */}
        <Section title="System Architecture Modules">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {[
              ['1. System Topology', '#topology'],
              ['2. Funnel: Auth & Onboarding', '#funnel-auth'],
              ['3. Funnel: Contracts Vault', '#funnel-contracts'],
              ['4. Funnel: Deliverables & AI', '#funnel-deliverables'],
              ['5. Funnel: Financials & Currency', '#funnel-financials'],
              ['6. Funnel: Torch AI Agent', '#funnel-ai'],
              ['7. Funnel: Billing & Subscriptions', '#funnel-billing'],
              ['8. Master Action Matrix', '#master-matrix'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/50 px-3 py-2 rounded-lg border border-border/40 transition-colors font-medium text-center"
              >
                {label}
              </a>
            ))}
          </div>
        </Section>

        {/* ─── SECTION 1: TOPOLOGY ─── */}
        <Section id="topology" title="1. High-Level System Topology">
          <P>
            Scrunity is structured around 5 decoupled core layers executing across Next.js 16 App Router:
          </P>

          <CodeBlock>{`┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER LAYER                              │
│  React 19 Client Components • Meta Lexical Prompt • Torch Co-Pilot • EvilCharts│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP Requests (JSON / Form Data / SSE)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS 16 APP ROUTER LAYER                         │
│  RSC Pre-rendering • React.cache() Deduplication • Streaming SSE Handlers    │
└──────────────┬───────────────────────┬───────────────────────┬──────────────┘
               │                       │                       │
               ▼                       ▼                       ▼
┌───────────────────────────┐ ┌───────────────────┐ ┌─────────────────────────┐
│     SECURITY & AUTH       │ │   SERVERLESS DB   │ │   GROQ & AI SDK ENGINE  │
│  Better Auth (Google)     │ │  Neon Postgres    │ │  openai/gpt-oss-120b    │
│  getProjectAccess Policy  │ │  Drizzle ORM      │ │  openai/gpt-oss-20b     │
└───────────────────────────┘ └───────────────────┘ └─────────────────────────┘
               │                       │                       │
               └───────────────────────┼───────────────────────┘
                                       │
                                       ▼ (Next.js 16 after() API)
┌─────────────────────────────────────────────────────────────────────────────┐
│                     BACKGROUND ASYNC NOTIFICATION WORKER                    │
│  Resend Transactional Email Dispatch • Audit Activity Log • In-App Notifs  │
└─────────────────────────────────────────────────────────────────────────────┘`}</CodeBlock>
        </Section>

        {/* ─── FUNNEL 1: AUTH & ONBOARDING ─── */}
        <Section id="funnel-auth" title="2. Funnel: Authentication, Tenant Context & Client Safeguards">
          <P>
            How users sign in, how session state resolves, and how strict client access guards prevent unauthorized access to <Code>/dashboard</Code>:
          </P>

          <CodeBlock>{`[User Clicks "Sign in with Google"] -> /sign-in
       │
       ▼ (Better Auth Catch-All Handler: src/app/api/auth/[...all]/route.ts)
[POST /api/auth/sign-in/social] -> Redirects to Google OAuth Consent
       │
       ▼ (Google Callback)
[GET /api/auth/callback/google] -> Better Auth sets session token cookie
       │
       ▼ (Next.js Server Component Navigation to /dashboard)
[getTenantContext(reqHeaders)] -> (Wrapped in React.cache() per request)
       │  ├─► Reads session & queries member table for organizationId & role
       │  └─► If missing activeOrganizationId, falls back to listOrganizations()
       │
       ▼ (DashboardLayout Access Guard: src/app/dashboard/layout.tsx)
[Queries user's member & projectMember tables concurrently]
       │
       ├─► IF user belongs to an Agency (member.role === "owner" | "agency" | "member"):
       │     └─► Renders Agency Dashboard Shell (Overview, Projects, Analytics, Team, AI, Billing)
       │
       └─► IF user is strictly a Client (member.role === "client" ONLY):
             └─► STRICT CLIENT SAFEGUARD: Blocked from /dashboard!
             └─► Automatically redirected to /projects/[firstProjectId]`}</CodeBlock>

          <H3>Database Tables Affected</H3>
          <Table
            headers={['Table Name', 'Operation', 'Key Columns']}
            rows={[
              ['user', 'Select / Insert', 'id, name, email, image'],
              ['session', 'Select / Insert', 'id, token, userId, activeOrganizationId, expiresAt'],
              ['account', 'Select / Insert', 'accountId, providerId, userId, accessToken'],
              ['organization', 'Select', 'id, name, slug, plan, logoUrl, subscriptionId'],
              ['member', 'Select', 'organizationId, userId, role'],
              ['project_member', 'Select', 'projectId, userId, role'],
            ]}
          />
        </Section>

        {/* ─── FUNNEL 2: CONTRACTS & E-SIGNATURE ─── */}
        <Section id="funnel-contracts" title="3. Funnel: Project Creation, Contract Vault & AI Scope Parser">
          <P>
            How agency owners create projects, upload SOW agreements, extract AI scope clauses, and execute e-signatures:
          </P>

          <CodeBlock>{`[Agency Clicks "Create Project"]
       │
       ▼ (POST /api/projects) -> Inserts row in project table
[Project Workspace Created: /projects/[projectId]]
       │
       ▼ (Agency Uploads Contract PDF in Contract Tab)
[POST /api/contracts] -> Uploads file to Vercel Blob private storage
       │  └─► Inserts contract row (documentType: "sow", status: "draft")
       │
       ▼ (Agency Clicks "Extract AI Scope Clauses")
[POST /api/ai/extract-contract] -> Calls Groq AI (gpt-oss-120b)
       │  ├─► Parses SOW text via unpdf
       │  └─► Inserts parsed terms into contract_scope_term table (scope, exclusion, revision_limit)
       │
       ▼ (Client Opens Contract in Workspace)
[POST /api/contracts/sign] -> Client executes E-Signature
       │  ├─► Inserts signature row (ipAddress, userAgent, signatureData)
       │  ├─► Generates SHA-256 Cryptographic Hash (documentHash)
       │  └─► Updates contract status to "signed" / "fully_signed" (Immutable!)`}</CodeBlock>

          <Callout>
            Contract PDFs are stored as private blobs in Vercel Blob. Downloads are authenticated through auth proxies (<Code>/api/contracts/download?contractId=X</Code>) using <Code>getProjectAccess()</Code>.
          </Callout>
        </Section>

        {/* ─── FUNNEL 3: DELIVERABLES & AI GUARDIAN ─── */}
        <Section id="funnel-deliverables" title="4. Funnel: Deliverables, Revisions & AI Scope Guardian">
          <P>
            How deliverables are submitted for review, how clients request revisions, and how AI detects scope creep:
          </P>

          <CodeBlock>{`[Agency Submits Deliverable]
       │
       ▼ (POST /api/deliverables) -> Inserts deliverable (status: "in_review")
[Client Views Submission in Workspace]
       │
       ├─► IF Client Clicks "Approve":
       │     └─► PATCH /api/deliverables -> status: "approved"
       │     └─► Automatically triggers linked payment_milestone status to "due"
       │
       └─► IF Client Clicks "Request Revision":
             │
             ▼ (PATCH /api/deliverables -> status: "revision_requested")
       [POST /api/ai/check-scope]
             │  ├─► Queries contract_scope_term for maxRevisions limit
             │  └─► Evaluates revision count for deliverable
             │
             ├─► IF Revisions <= maxRevisions:
             │     └─► ScopeGuardianPill renders "within_scope" (Green)
             │
             └─► IF Revisions > maxRevisions:
                   └─► ScopeGuardianPill renders "scope_creep_alert" (Red)
                   └─► Triggers AI Addendum Drafter (POST /api/ai/generate-addendum)
                   └─► Inserts proposal row for Change Order SOW with pricing`}</CodeBlock>
        </Section>

        {/* ─── FUNNEL 4: FINANCIALS, INVOICING & MULTI-CURRENCY ─── */}
        <Section id="funnel-financials" title="5. Funnel: Invoicing, Payment Milestones & Multi-Currency Engine">
          <P>
            How invoices and payment milestones are created, verified with reference notes, and converted dynamically across global currencies:
          </P>

          <CodeBlock>{`[Milestone Completed or Invoice Drafted] (e.g. $2,500 USD, ₹1,00,000 INR, €2,000 EUR)
       │
       ├─► Path A: Milestone Flow (POST /api/milestones) -> Inserts payment_milestone row
       │     └─► Client Makes Transfer & Agency Verifies Payment (POST /api/milestones/mark-paid)
       │     └─► Inserts payment row (referenceNote, paymentMethod: "bank_transfer" / "upi")
       │
       └─► Path B: Direct Invoicing Flow (POST /api/invoices)
             ├─► Inserts invoice & invoice_item rows (status: "draft" | "sent")
             ├─► Agency sends invoice link to client -> Client views document view (status: "viewed")
             ├─► Agency records payment with UTR / reference -> PATCH /api/invoices/[id] (status: "paid")
             └─► Renders Vercel-inspired document view (InvoiceDocumentView) with real-time PDF generation
       │
       ▼ (Multi-Currency Conversion Engine: src/lib/currency.ts)
[Live 24h-Cached FX Rate: Frankfurter & Open Exchange APIs]
       ├─► Converts international currencies dynamically for organization dashboard KPI cards
       ├─► Formats currency dynamically via formatCurrency(value, currency, targetCurrency, rate)
       └─► Updates PaymentsRadialChart, DashboardKpiRow, & Analytics Hero Velocity`}</CodeBlock>
        </Section>

        {/* ─── FUNNEL 5: TORCH AI AGENT ─── */}
        <Section id="funnel-ai" title="6. Funnel: Torch AI Co-Pilot & Streaming Multi-Tool Loop">
          <P>
            How prompts typed in Meta Lexical input stream multi-step tool calls, render live reasoning, and execute human-in-the-loop actions:
          </P>

          <CodeBlock>{`[User Enters Prompt in LexicalAIInput] (/dashboard/ai)
       │  ├─► Supports "/" slash commands (/summarize, /analyze-revenue, /draft-contract)
       │  └─► Supports "@" mention popover to attach project context
       │
       ▼ (POST /api/ai/torch) -> AI SDK v7 Event Stream
[Groq LLM Engine (openai/gpt-oss-120b)]
       │
       ▼ (Multi-Step Tool Loop Execution: src/lib/ai/torch-tools.ts)
[Tool Invocation Step]
       │  ├─► Query Tools: queryWorkspaceOverview, auditProjectScope, analyzeFinancials, generateClientDigest, queryInvoiceStatus
       │  │     └─► DB Date serialization via toIsoDate ensures strict JSON schema compliance
       │  │     └─► Structured result cards render in strict hierarchy: Reasoning -> Cards -> Text Response
       │  │
       │  ├─► External Search Tool: webSearch (Firecrawl /v2/search + fallbacks)
       │  │     └─► Strictly reserved for external web lookups; internal projects execute internal DB tools
       │  │     └─► Rate-limited by 60 req/hr sliding-window circuit breaker
       │  │
       │  └─► Draft Tools: generateAddendumDraft, createDeliverableDraft, draftInvoiceForMilestone
       │        └─► Renders interactive ApprovalCard in message stream
       │
       ▼ (Human-in-the-Loop Action)
[User Clicks "Approve" on ApprovalCard]
       │
       ▼ (POST /api/ai/torch/confirm)
[Executes DB Mutation: Inserts proposal / deliverable / invoice row atomically]
       │
       └─► Updates ApprovalCard status to "applied" with check confirmation`}</CodeBlock>
        </Section>

        {/* ─── FUNNEL 6: BILLING, POOLED CREDITS & SUBSCRIPTIONS ─── */}
        <Section id="funnel-billing" title="7. Funnel: Billing, Organization Pooled Credits & Circuit Breakers">
          <P>
            How agency organizations draw from pooled AI and web search credits aligned to billing cycles:
          </P>

          <CodeBlock>{`[Agency Executes Torch AI Action or Web Search]
       │
       ▼ (checkCreditAllowance: src/lib/ai/credits.ts)
[Queries organizationCreditPeriod for current billing cycle]
       │  ├─► Aligns with organization.currentPeriodEnd with clock-skew tolerance (+60s)
       │  ├─► Resets pool automatically on cycle expiration (Zero-Rollover)
       │  └─► Soft-Cap Mode: ENFORCE_CREDIT_LIMITS = false tracks usage without blocking client work
       │
       ▼ (IF Tool is webSearch -> checkSearchCircuitBreaker)
[Sliding-Window Rate Limiter: src/lib/ai/search-circuit-breaker.ts]
       │  └─► Enforces 60 requests/hour limit per organization protecting external search APIs
       │
       ▼ (recordCreditUsage: src/lib/ai/credits.ts)
[Atomically increments aiCreditsUsed / searchCreditsUsed & logs to usage_event table]
       │
       ▼ (Billing & Usage UI: /dashboard/settings?tab=billing)
[GET /api/organizations/credits -> Renders CreditUsageCard with progress meters]`}</CodeBlock>
        </Section>

        {/* ─── MASTER MATRIX ─── */}
        <Section id="master-matrix" title="8. Master User Action to API Route & Database Matrix">
          <P>
            The complete code audit matrix mapping every user action across Scrunity to its triggering component, API endpoint, authorization policy, database table mutations, and background tasks:
          </P>

          <Table
            headers={['User Action / Event', 'Trigger Component', 'API Endpoint & Method', 'Auth Policy', 'Database Mutations', 'Async Background Worker (after())']}
            rows={[
              ['Sign in with Google', 'SignInButton', 'POST /api/auth/sign-in/social', 'Better Auth', 'Selects user, session, account tables', 'Sets session token cookie'],
              ['Execute Torch AI Prompt', 'LexicalAIInput', 'POST /api/ai/torch', 'getTenantContext', 'Streams tool outputs over SSE', 'Logs usage_event & increments credits'],
              ['Confirm Torch Draft', 'ApprovalCard', 'POST /api/ai/torch/confirm', 'canManageProject', 'Inserts proposal, deliverable, or invoice row', 'Logs activity_log entry'],
              ['Fetch Credit Summary', 'CreditUsageCard', 'GET /api/organizations/credits', 'getTenantContext', 'Queries organization_credit_period', 'None'],
              ['Create Invoice Draft', 'InvoiceCreateModal', 'POST /api/invoices', 'canManageProject', 'Inserts invoice & invoice_item rows', 'Logs activity_log entry'],
              ['Mark Invoice Paid', 'InvoiceDetailView', 'PATCH /api/invoices/[id]', 'canManageProject', 'Updates invoice status to paid, records payment', 'Dispatches payment confirmation email'],
              ['Initiate Plan Upgrade', 'PricingCard', 'POST /api/billing/checkout', 'auth.api.getSession', 'Selects organization plan', 'Generates checkout redirect'],
              ['Open Billing Portal', 'BillingPortalButton', 'POST /api/billing/portal', 'auth.api.getSession', 'Selects organization subscription', 'Generates portal redirect'],
              ['Process Plan Webhook', 'WebhookReceiver', 'POST /api/billing/webhook', 'Signature Seal', 'Updates organization (plan, status, periodEnd)', 'Expands credit period pool'],
              ['Create New Project', 'CreateProjectModal', 'POST /api/projects', 'getTenantContext', 'Inserts project, project_member (role: owner)', 'Logs activity_log entry'],
              ['Update Project Details', 'ProjectSettingsForm', 'PATCH /api/projects', 'canManageProject', 'Updates project (name, description, status)', 'Logs activity_log entry'],
              ['Delete Project', 'ProjectSettingsForm', 'DELETE /api/projects', 'canManageProject', 'Deletes project & cascades to all related tables', 'Purges project files from Blob'],
              ['Upload Contract PDF', 'ContractUploadButton', 'POST /api/contracts', 'canManageProject', 'Inserts contract (fileUrl, status: draft)', 'Triggers /api/ai/extract-contract'],
              ['Extract AI Scope Terms', 'ContractAIDrawer', 'POST /api/ai/extract-contract', 'getProjectAccess', 'Inserts rows into contract_scope_term', 'Logs activity_log entry'],
              ['Execute E-Signature', 'ESignatureModal', 'POST /api/contracts/sign', 'getProjectAccess', 'Inserts signature row, updates contract status to signed', 'Dispatches email notification via Resend'],
              ['Delete Contract', 'ContractVaultClient', 'DELETE /api/contracts', 'canManageProject', 'Blocks if status is signed/fully_signed; else deletes contract', 'Removes file from Blob'],
              ['Submit Deliverable', 'DeliverableModal', 'POST /api/deliverables', 'canManageProject', 'Inserts deliverable (status: in_review)', 'Notifies client stakeholders via after()'],
              ['Approve Deliverable', 'DeliverablesList', 'PATCH /api/deliverables', 'getProjectAccess', 'Updates deliverable to approved, updates linked milestone to due', 'Logs deliverable_approved activity'],
              ['Request Revision', 'DeliverablesList', 'PATCH /api/deliverables', 'getProjectAccess', 'Updates deliverable to revision_requested', 'Calls /api/ai/check-scope'],
              ['Check Scope Creep', 'ScopeGuardianPill', 'POST /api/ai/check-scope', 'getProjectAccess', 'Selects contract_scope_term vs deliverable count', 'Returns scope status'],
              ['Draft AI Addendum', 'AddendumModal', 'POST /api/ai/generate-addendum', 'canManageProject', 'Inserts proposal row for Change Order SOW', 'Launches proposal drawer'],
              ['Create Milestone', 'MilestoneModal', 'POST /api/milestones', 'canManageProject', 'Inserts payment_milestone row', 'Recalculates PaymentsRadialChart'],
              ['Mark Milestone Paid', 'MarkPaidModal', 'POST /api/milestones/mark-paid', 'getProjectAccess', 'Inserts payment row, updates milestone status to paid', 'Dispatches payment confirmation email'],
              ['Create Proposal', 'ProposalDrawer', 'POST /api/proposals', 'canManageProject', 'Inserts proposal row (title, price, currency)', 'Logs activity_log entry'],
              ['Send Proposal', 'ProposalDrawer', 'PATCH /api/proposals', 'canManageProject', 'Updates proposal status to sent', 'Sends proposal link email to client'],
              ['Upload Project File', 'FilesUploadButton', 'POST /api/files', 'getProjectAccess', 'Inserts files row (name, url, size, mimeType)', 'Logs file_uploaded activity'],
              ['Download Private File', 'FileListRow', 'GET /api/files/download', 'getProjectAccess', 'Streams private Vercel Blob file', 'None'],
              ['Accept Org Invite', 'AcceptOrgInviteButton', 'POST /api/organizations/invites/accept', 'auth.api.getSession', 'Updates invitation to accepted, inserts member row', 'Redirects to /dashboard'],
              ['Accept Project Invite', 'AcceptProjectInviteButton', 'POST /api/projects/invites/accept', 'auth.api.getSession', 'Updates project_invitation to accepted, inserts project_member', 'Syncs contract signature rows'],
              ['Post Comment', 'CommentSection', 'POST /api/comments', 'getProjectAccess', 'Inserts comment row', 'Logs comment_added activity'],
            ]}
          />
        </Section>

        {/* Footer */}
        <footer className="mt-20 pt-6 border-t border-border/40 flex justify-between items-center text-[11px] text-muted-foreground">
          <span>Scrunity Execution Architecture Documentation</span>
          <span className="tabular-nums">Audited: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </footer>
      </div>
    </div>
  );
}
