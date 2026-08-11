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
  title: "Application Execution Flow & API Architecture",
  description: "Visual application execution flow, user funnels, API routes, database mutations, and data flow map for Scrunity.",
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
      
      {/* Floating Header Navigation */}
      <nav className="sticky top-0 z-50 h-13 px-6 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/docs" className="text-[13px] text-muted-foreground hover:text-foreground font-medium transition-colors">
            ← Back to Docs
          </Link>
          <span className="text-border/60">|</span>
          <span className="text-[14px] font-bold tracking-tight text-foreground">Scrunity Execution Map</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
            Data Flow Architecture
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono font-medium">v0.0.1</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-10 pb-32 space-y-10">
        {/* Page Hero */}
        <header className="mb-10">
          <h1 className="text-[36px] font-semibold tracking-tight leading-tight text-foreground mb-3 text-balance">
            Application Execution & Data Flow
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground max-w-3xl text-pretty">
            Complete visual architecture guide showing how user actions, frontend component triggers, API routes, database mutations, and AI engines interlock across Scrunity.
          </p>
        </header>

        {/* Navigation Quick Jump */}
        <Section title="Execution Map Jump List">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {[
              ['1. Onboarding & Org Setup', '#funnel-onboarding'],
              ['2. Contract E-Sign & AI Vault', '#funnel-contract'],
              ['3. Deliverables & AI Scope Guardian', '#funnel-deliverables'],
              ['4. Milestone Payments & Multi-Currency', '#funnel-payments'],
              ['5. Scrunity AI Lexical Engine', '#funnel-ai'],
              ['6. Master User Click to API Table', '#master-api-table'],
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

        {/* ─── FUNNEL 1: ONBOARDING & ORG SETUP ─── */}
        <Section id="funnel-onboarding" title="Funnel 1: Onboarding & Workspace Setup">
          <P>
            How agency owners sign up, establish an organization, invite clients via white-labeled links, and how client safeguards operate:
          </P>

          <CodeBlock>{`[User Sign In / Up]
       │
       ▼  (Google OAuth via Better Auth)
[POST /api/auth/sign-in]
       │
       ├─► (Checks Database: user & member tables)
       │
       ├─► IF Agency Owner (member.role === "owner"):
       │     └─► Redirects to /dashboard (Overview, Projects, Analytics, Team, AI)
       │
       └─► IF Client Stakeholder (member.role === "client"):
             └─► Strictly blocked from /dashboard by DashboardLayout guard!
             └─► Redirects directly to /projects/[projectId]`}</CodeBlock>

          <H3>Step-by-Step Execution Sequence</H3>
          <ol className="my-3 pl-5 text-xs text-muted-foreground leading-relaxed space-y-2 list-decimal font-mono">
            <li>
              <strong className="text-foreground font-semibold">Google OAuth Sign In:</strong> User clicks &quot;Sign in with Google&quot; on <Code>/sign-in</Code> → calls Better Auth API → returns session token cookie.
            </li>
            <li>
              <strong className="text-foreground font-semibold">Tenant Context Resolution:</strong> Server component calls <Code>getTenantContext(reqHeaders)</Code> (wrapped in <Code>React.cache()</Code>) → fetches active organization &amp; user role.
            </li>
            <li>
              <strong className="text-foreground font-semibold">Client Safeguard Redirect:</strong> <Code>DashboardLayout</Code> queries database memberships. If user is strictly a client, redirects automatically to <Code>/projects/[firstProjectId]</Code>.
            </li>
            <li>
              <strong className="text-foreground font-semibold">Client Onboarding Link (<Code>/invite/project/[inviteId]</Code>):</strong> Agency copies project invite link → Client opens white-labeled onboarding page → Clicks &quot;Accept Invitation&quot; → POST <Code>/api/projects/invites/accept</Code> creates <Code>projectMember</Code> row with <Code>role: &quot;client&quot;</Code> &amp; initializes contract signature rows.
            </li>
          </ol>
        </Section>

        {/* ─── FUNNEL 2: CONTRACT E-SIGN & AI VAULT ─── */}
        <Section id="funnel-contract" title="Funnel 2: Contract E-Sign & AI Scope Engine">
          <P>
            The lifecycle of uploading an SOW contract PDF, Groq AI parsing scope clauses, e-signature execution, and cryptographic hash sealing:
          </P>

          <CodeBlock>{`[Agency Uploads SOW PDF]
       │
       ▼  (POST /api/contracts -> Vercel Blob private storage)
[Contract Stored in Blob Vault]
       │
       ▼  (POST /api/ai/extract-contract)
[Groq AI Clause Parser (gpt-oss-120b)]
       │  ├─► Extracts Scope Items, Exclusions, Revision Limits, Payment Terms
       │  └─► Inserts rows into contract_scope_term table
       │
       ▼  (Client Notification via Next.js after())
[Client Views Contract in Project Workspace]
       │
       ▼  (Clicks "E-Sign Agreement")
[POST /api/contracts/sign]
       │  ├─► Inserts signature row with IP address & User Agent
       │  ├─► Generates SHA-256 Cryptographic Audit Hash
       │  └─► Updates contract status to "signed" / "fully_signed" (Immutable)`}</CodeBlock>

          <Callout>
            Contracts with signature records (<Code>signed</Code>, <Code>partially_signed</Code>, <Code>fully_signed</Code>) are strictly immutable in the database and cannot be modified or deleted by any user role.
          </Callout>
        </Section>

        {/* ─── FUNNEL 3: DELIVERABLES & SCOPE GUARDIAN ─── */}
        <Section id="funnel-deliverables" title="Funnel 3: Deliverables, Revisions & AI Scope Guardian">
          <P>
            How deliverables are submitted, reviewed, and how the AI Scope Guardian detects revision overflow and generates Change Order SOW addendums:
          </P>

          <CodeBlock>{`[Agency Submits Deliverable]
       │
       ▼  (POST /api/deliverables -> status: "in_review")
[Client Inspection in Deliverables Tab]
       │
       ├─► IF Approved:
       │     └─► PATCH /api/deliverables (status: "approved")
       │     └─► Triggers linked payment milestone to "due"
       │
       └─► IF Revision Requested:
             │
             ▼  (POST /api/ai/check-scope)
       [AI Scope Guardian Evaluates Contract Terms]
             │
             ├─► IF Revisions <= Limit:
             │     └─► ScopeGuardianPill renders "within_scope" (Green)
             │
             └─► IF Revisions > Limit:
                   └─► ScopeGuardianPill renders "scope_creep_alert" (Red)
                   └─► Launches AI Addendum Generator (POST /api/ai/generate-addendum)
                   └─► Creates Change Order proposal with pricing`}</CodeBlock>
        </Section>

        {/* ─── FUNNEL 4: MILESTONE PAYMENTS & MULTI-CURRENCY ─── */}
        <Section id="funnel-payments" title="Funnel 4: Milestone Payments & Multi-Currency Engine">
          <P>
            How payment milestones are created, verified, converted across INR/USD, and reflected in workspace analytics:
          </P>

          <CodeBlock>{`[Payment Milestone Defined] (Amount: $2,500 USD or ₹1,00,000 INR)
       │
       ▼  (POST /api/milestones)
[Milestone Status: "upcoming" | "due"]
       │
       ▼  (Client Makes Bank Transfer / Payment)
[POST /api/milestones/mark-paid]
       │  ├─► Accepts UTR Reference Note & Payment Method
       │  ├─► Inserts row into payment table
       │  └─► Updates milestone status to "paid"
       │
       ▼  (Multi-Currency Exchange Rate Engine: src/lib/currency.ts)
[USD_TO_INR_RATE = 95.43]
       │  ├─► Converted to INR for global organization pipeline totals
       │  └─► Displayed in PaymentsRadialChart & Analytics Hero Velocity`}</CodeBlock>
        </Section>

        {/* ─── FUNNEL 5: SCRUNITY AI LEXICAL ENGINE ─── */}
        <Section id="funnel-ai" title="Funnel 5: Scrunity AI Lexical Prompt & Workspace Context Engine">
          <P>
            How the Scrunity AI route (<Code>/dashboard/ai</Code>) processes user input via Meta Lexical and streams executive insights:
          </P>

          <CodeBlock>{`[User Types Prompt in LexicalAIInput]
       │
       ├─► Types "/" -> Triggers Slash Command Popover (/summarize, /analyze-revenue)
       ├─► Types "@" -> Triggers Mention Popover (@ProjectName)
       │
       ▼  (Presses Enter -> KeyboardSubmitPlugin)
[ScrunityAIView.handleSend()]
       │
       ▼  (Promise.all Context Resolution in page.tsx)
[Queries Live DB Snapshot for Workspace]
       │  ├─► Active Projects list & statuses
       │  ├─► Deliverable review counts
       │  ├─► Total won revenue & pipeline
       │  └─► Plan tier
       │
       ▼  (SCRUNITY_SYSTEM_PROMPT Injection)
[Chain of Thought Reasoning (ScrunityAIChainOfThought)]
       │  ├─► Step 1: Querying Workspace System Context
       │  ├─► Step 2: Analyzing Deliverables & Contract Volume
       │  └─► Step 3: Synthesizing Executive Recommendation
       │
       ▼  (Executive AI Markdown Stream Response)
[Renders Clean Bubble with Copy-to-Clipboard Action]`}</CodeBlock>
        </Section>

        {/* ─── MASTER API & MUTATION TABLE ─── */}
        <Section id="master-api-table" title="Master User Action to API & Database Mapping">
          <P>
            Comprehensive reference mapping every user button click in the UI to its corresponding frontend component, API endpoint, database query/mutation, and background notification tasks:
          </P>

          <Table
            headers={['User Action / Button Click', 'Frontend Component', 'HTTP Route / Method', 'Database Mutation / Query', 'Background Task (after())']}
            rows={[
              ['Sign in with Google', 'SignInButton', 'POST /api/auth/sign-in', 'Selects user, member, organization tables', 'Creates session token cookie'],
              ['Accept Project Invite', 'AcceptProjectInviteButton', 'POST /api/projects/invites/accept', 'Updates invitation to accepted, inserts projectMember row', 'Sends notification email via Resend'],
              ['Accept Org Invite', 'AcceptOrgInviteButton', 'POST /api/organizations/invites/accept', 'Updates invitation to accepted, inserts member row', 'Redirects to /dashboard'],
              ['Upload Contract PDF', 'ContractUploadButton', 'POST /api/contracts', 'Inserts contract row (fileUrl, status: draft)', 'Triggers AI Scope Extraction'],
              ['Extract AI Scope Clauses', 'ContractAIDrawer', 'POST /api/ai/extract-contract', 'Inserts rows into contract_scope_term', 'Logs activity_log entry'],
              ['E-Sign Agreement', 'ESignatureModal', 'POST /api/contracts/sign', 'Inserts signature row, computes SHA-256 hash, updates contract status', 'Dispatches email notification to agency'],
              ['Submit Deliverable', 'DeliverableModal', 'POST /api/deliverables', 'Inserts deliverable row (status: in_review)', 'Notifies client via after()'],
              ['Approve Deliverable', 'DeliverablesList', 'PATCH /api/deliverables', 'Updates deliverable status to approved, updates linked milestone', 'Logs deliverable_approved activity'],
              ['Request Revision', 'DeliverablesList', 'PATCH /api/deliverables', 'Updates deliverable status to revision_requested', 'Calls /api/ai/check-scope'],
              ['Check AI Scope Creep', 'ScopeGuardianPill', 'POST /api/ai/check-scope', 'Queries contract_scope_term vs revision count', 'Returns within_scope or scope_creep_alert'],
              ['Generate AI Addendum', 'AddendumModal', 'POST /api/ai/generate-addendum', 'Inserts proposal row with Change Order line items', 'Launches proposal drawer'],
              ['Mark Milestone Paid', 'MarkPaidModal', 'POST /api/milestones/mark-paid', 'Inserts payment row (UTR note), updates milestone status to paid', 'Recalculates PaymentsRadialChart'],
              ['Send Proposal', 'ProposalDrawer', 'PATCH /api/proposals', 'Updates proposal status to sent', 'Sends proposal link email to client'],
              ['Execute Lexical AI Prompt', 'LexicalAIInput', 'ScrunityAIView.handleSend()', 'Promise.all queries org, project, proposal, deliverable tables', 'Executes Chain of Thought reasoning'],
              ['Copy Invite Link', 'ProjectNavbarInviteButton', 'Navigator Clipboard API', 'Reads invite link for project', 'Shows toast success'],
            ]}
          />
        </Section>

        {/* Footer */}
        <footer className="mt-20 pt-6 border-t border-border/40 flex justify-between items-center text-[11px] text-muted-foreground">
          <span>Scrunity Execution Architecture Documentation</span>
          <span className="tabular-nums">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </footer>
      </div>
    </div>
  );
}
