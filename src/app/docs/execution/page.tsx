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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {[
              ['1. High-Level System Topology', '#topology'],
              ['2. Funnel: Auth & Onboarding', '#funnel-auth'],
              ['3. Funnel: Projects & Contracts Vault', '#funnel-contracts'],
              ['4. Funnel: Deliverables & AI Guardian', '#funnel-deliverables'],
              ['5. Funnel: Milestones & Multi-Currency', '#funnel-financials'],
              ['6. Funnel: Scrunity AI Lexical Engine', '#funnel-ai'],
              ['7. Master Action-to-API Matrix', '#master-matrix'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/50 px-3 py-2 rounded-lg border border-border/40 transition-colors font-medium"
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
│  React 19 Client Components • Meta Lexical Prompt • EvilCharts (ECharts)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP Requests (JSON / Form Data)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS 16 APP ROUTER LAYER                         │
│  RSC Pre-rendering • React.cache() Deduplication • Dynamic SSR Route Handlers│
└──────────────┬───────────────────────┬───────────────────────┬──────────────┘
               │                       │                       │
               ▼                       ▼                       ▼
┌───────────────────────────┐ ┌───────────────────┐ ┌─────────────────────────┐
│     SECURITY & AUTH       │ │   SERVERLESS DB   │ │    GROQ AI ENGINE       │
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
       │     └─► Renders Agency Dashboard Shell (Overview, Projects, Analytics, Team, AI)
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
              ['organization', 'Select', 'id, name, slug, plan, logoUrl'],
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

        {/* ─── FUNNEL 4: FINANCIALS & MULTI-CURRENCY ─── */}
        <Section id="funnel-financials" title="5. Funnel: Payment Milestones & Multi-Currency Engine">
          <P>
            How payment milestones are created, verified with reference notes, and converted between USD and INR:
          </P>

          <CodeBlock>{`[Milestone Created] (e.g. $2,500 USD or ₹1,00,000 INR)
       │
       ▼ (POST /api/milestones) -> Inserts payment_milestone row
[Status: "upcoming" | "due"]
       │
       ▼ (Client Makes Transfer & Agency Verifies Payment)
[POST /api/milestones/mark-paid]
       │  ├─► Inserts payment row (referenceNote, paymentMethod: "bank_transfer" / "upi")
       │  └─► Updates payment_milestone status to "paid"
       │
       ▼ (Multi-Currency Conversion Engine: src/lib/currency.ts)
[USD_TO_INR_RATE = 95.43]
       │  ├─► USD contract/proposal values converted to INR for organization totals
       │  ├─► Formats currency dynamically via formatCurrency(value, currency)
       │  └─► Updates PaymentsRadialChart, DashboardKpiRow, & Analytics Hero Velocity`}</CodeBlock>
        </Section>

        {/* ─── FUNNEL 5: SCRUNITY AI LEXICAL ─── */}
        <Section id="funnel-ai" title="6. Funnel: Scrunity AI Lexical Prompt & Workspace Context Engine">
          <P>
            How user prompts typed into Meta Lexical editor execute against live workspace database context:
          </P>

          <CodeBlock>{`[User Types Prompt in LexicalAIInput] (/dashboard/ai)
       │
       ├─► Types "/" -> Triggers Slash Command Menu (/summarize, /analyze-revenue)
       ├─► Types "@" -> Triggers Mention Menu (@ProjectName)
       │
       ▼ (Presses Enter -> KeyboardSubmitPlugin)
[ScrunityAIView.handleSend(promptText)]
       │
       ▼ (Server Page Execution: src/app/dashboard/ai/page.tsx)
[Promise.all Concurrent Queries]
       │  ├─► Queries organization details (name, plan)
       │  ├─► Queries org active projects
       │  ├─► Queries accepted proposals total value
       │  └─► Queries deliverables pending review count
       │
       ▼ (Constructs SCRUNITY_SYSTEM_PROMPT)
[ScrunityAIChainOfThought Reasoning Execution]
       │  ├─► Step 1: Querying Workspace System Context
       │  ├─► Step 2: Analyzing Deliverables & Contract Volume
       │  └─► Step 3: Synthesizing Executive Recommendation
       │
       ▼ (Executive AI Response Render)
[Renders Markdown Content Bubble + Copy-to-Clipboard Action]`}</CodeBlock>
        </Section>

        {/* ─── MASTER MATRIX ─── */}
        <Section id="master-matrix" title="7. Master User Action to API Route & Database Matrix">
          <P>
            The complete code audit matrix mapping every user action across Scrunity to its triggering component, API endpoint, authorization policy, database table mutations, and background tasks:
          </P>

          <Table
            headers={['User Action / Event', 'Trigger Component', 'API Endpoint & Method', 'Auth Policy', 'Database Mutations', 'Async Background Worker (after())']}
            rows={[
              ['Sign in with Google', 'SignInButton', 'POST /api/auth/sign-in/social', 'Better Auth', 'Selects user, session, account tables', 'Sets session token cookie'],
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
              ['Execute Lexical Prompt', 'LexicalAIInput', 'ScrunityAIView.handleSend()', 'getTenantContext', 'Promise.all queries org, project, proposal, deliverable tables', 'Renders Chain of Thought reasoning'],
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
