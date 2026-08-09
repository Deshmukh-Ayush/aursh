import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Section,
  H3,
  P,
  Code,
  CodeBlock,
  Table,
} from "./doc-components";

export const metadata: Metadata = {
  title: "Developer Docs",
  description: "Internal developer documentation for Scrunity — architecture, EvilCharts visual analytics, DB schema, API routes, multi-currency engine, and design system conventions.",
};

// Gate: only allow specific developer emails
const DEVELOPER_EMAILS = [
  "losted710@gmail.com",
  // Add more developer emails here
];

export default async function DocsPage() {
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
      
      {/* Floating nav */}
      <nav className="sticky top-0 z-50 h-13 px-6 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-[14px] font-bold tracking-tight text-foreground">Scrunity</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00AAF7]/10 text-[#00AAF7] dark:text-[#00AAF7] tracking-wider uppercase">
            Internal Developer Docs
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono font-medium">v0.0.1</span>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-12 pb-32 space-y-8">
        {/* Hero Header */}
        <header className="mb-12">
          <h1 className="text-[36px] font-semibold tracking-tight leading-tight text-foreground mb-3 text-balance">
            Developer Documentation
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground max-w-2xl text-pretty">
            Technical architecture, EvilCharts data visualization system, database schemas, API route specs, multi-currency handling, and pixel-identical design conventions for Scrunity.
          </p>
        </header>

        {/* Table of Contents */}
        <Section title="Contents">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {[
              ['What is Scrunity?', '#overview'],
              ['Tech Stack & EvilCharts', '#stack'],
              ['Folder Structure', '#folders'],
              ['Design System & Component Rules', '#design-system'],
              ['EvilCharts Analytics Architecture', '#evilcharts'],
              ['AI Scope Guardian & Clause Engine', '#ai-engine'],
              ['Multi-Currency Engine (INR / USD)', '#currency'],
              ['Database Schema', '#schema'],
              ['Contract & E-Signature Vault', '#contracts'],
              ['API Routes Specification', '#api'],
              ['Environment Variables', '#env'],
              ['Dev & Verification Commands', '#commands'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/50 px-2.5 py-1.5 rounded-md transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </Section>

        {/* ─── OVERVIEW ─── */}
        <Section id="overview" title="What is Scrunity?">
          <P>
            Scrunity is an AI-powered agency revenue protection and client collaboration OS. It replaces fragmented tools (DocuSign, Trello, WhatsApp, Excel invoices) with a single source of truth for payment tracking, contract execution, deliverable reviews, AI scope creep guardian, and audit logs.
          </P>
          <P>User roles and permissions:</P>
          <ul className="my-2 pl-5 text-sm text-muted-foreground leading-relaxed space-y-1 list-disc">
            <li><Code>owner</Code> — Agency owner. Full control over project creation, billing, contract vault, proposal generation, and team management.</li>
            <li><Code>agency</Code> — Agency team member. Can create deliverables, upload agreements, send proposals, and verify payment milestones.</li>
            <li><Code>client</Code> — Invited client stakeholder. Can upload agreements (NDA, NOC), e-sign contracts, review deliverables, request revisions, and view payment status.</li>
          </ul>
        </Section>

        {/* ─── TECH STACK ─── */}
        <Section id="stack" title="Tech Stack & EvilCharts">
          <Table
            headers={['Layer', 'Technology', 'Notes']}
            rows={[
              ['Framework', 'Next.js 16 (App Router)', 'RSC by default, Turbopack, async params'],
              ['Language', 'TypeScript 5', 'Strict type safety (tsc --noEmit)'],
              ['AI Engine', 'Vercel AI SDK + Groq', 'Primary: openai/gpt-oss-120b | Fallback: llama-3.3-70b-versatile'],
              ['Charts & Analytics', 'EvilCharts Component Suite', 'EChartsRadialChart, EChartsAreaChart, EChartsBarChart'],
              ['Database', 'Neon (Serverless Postgres)', 'Stateless HTTP driver @neondatabase/serverless'],
              ['ORM', 'Drizzle ORM', 'Schema defined in src/db/schema.ts'],
              ['Auth', 'Better Auth', 'Google OAuth + organization plugin'],
              ['State Management', 'Zustand', 'Modular stores in src/store/ (ai-store.ts, etc.)'],
              ['Icons', 'Phosphor Icons & Lucide', '@phosphor-icons/react in client components, Lucide in RSC'],
              ['Styling', 'Tailwind CSS v4 & CSS Variables', 'Brand color #00AAF7, dark mode, custom neutral tokens'],
              ['Storage', 'Vercel Blob', 'PDF contract uploads and attachment storage'],
              ['Email', 'Resend', 'Transactional emails for invites and notifications'],
            ]}
          />
        </Section>

        {/* ─── FOLDER STRUCTURE ─── */}
        <Section id="folders" title="Folder Structure">
          <CodeBlock>{`src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (ThemeProvider, Sonner)
│   ├── globals.css             # Brand color #00AAF7, Tailwind v4 theme
│   ├── docs/                   # Developer documentation route
│   ├── dashboard/              # Main organization dashboard
│   ├── api/ai/                 # AI Engine API endpoints
│   │   ├── extract-contract/   # PDF Scope Extraction & DB persistence
│   │   ├── check-scope/        # Revision limit evaluator & scope creep alert
│   │   └── generate-addendum/  # AI Change Order SOW addendum generator
│   └── projects/[projectId]/   # Project workspace routes
│       ├── page.tsx            # Overview dashboard (2 Hero KPI Cards, EvilCharts)
│       ├── payments/           # PaymentsRadialChart, multi-currency, milestones
│       ├── proposal/           # ProposalDonutChart, proposal builder drawer
│       ├── deliverables/       # DeliverablesVelocityChart, Scope Guardian badges
│       ├── contract/           # ContractStatusChart, ContractAIDrawer, e-signatures
│       ├── activity/           # ActivityBarChart, category filters
│       ├── files/              # FilesStorageChart, file list
│       └── settings/           # Project settings & member management
│
├── components/
│   ├── evilcharts/             # EvilCharts Visualization Library
│   └── projects/               # Domain Component Modules
│       ├── overview/           # ProjectOverviewHero, MomentumChart, StatusChart
│       ├── deliverables/       # DeliverablesVelocityChart, ScopeGuardianPill
│       ├── contracts/          # ContractVaultClient, ContractAIDrawer, ContractAIStepper
│       └── proposal/           # ProposalDonutChart, AddendumModal
│
├── lib/ai/                     # Core AI Layer
│   ├── client.ts               # Groq AI client with LLM model fallback engine
│   ├── schemas.ts              # Zod v4 schemas with strict preprocessors
│   ├── pdf-extractor.ts        # PDF text extraction via unpdf
│   ├── contract-parser.ts      # AI PDF scope parser & DB persistence
│   ├── scope-guardian.ts       # Scope revision limit evaluator
│   └── addendum-generator.ts   # SOW Change Order addendum engine
│
├── store/                      # Zustand State Management (ai-store.ts)
├── db/                         # Drizzle schema definitions (schema.ts)
└── lib/                        # Server actions, Better Auth, pdf signing`}</CodeBlock>
        </Section>

        {/* ─── DESIGN SYSTEM ─── */}
        <Section id="design-system" title="Design System & Component Rules">
          <P>
            Scrunity enforces strict design rules across every tab in the application to maintain 100% visual consistency:
          </P>
          <Table
            headers={['Pattern', 'CSS & HTML Specification', 'Usage']}
            rows={[
              ['Brand Primary Button', 'active:scale-[0.96] transition-transform h-9 px-4 rounded-full bg-[#00AAF7] text-white font-semibold text-sm flex items-center gap-1.5', 'Main page CTA buttons across all sections'],
              ['Container Outer Frame', 'rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900', 'Outer container frame for all charts & hero cards'],
              ['Container Inner Card', 'rounded-md bg-white p-4 dark:bg-neutral-950', 'Inner white/dark card wrapping chart content'],
              ['Row Item List Standard', 'group flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 py-2.5 px-3 hover:bg-muted/40 border-b border-border/40 last:border-0 transition-colors rounded-md', '100% pixel-identical row list layout across all tabs'],
              ['Page Title Header', 'text-[36px] font-semibold tracking-tight text-foreground text-balance leading-tight', 'Main section heading on every project tab'],
              ['Section Title Header', 'text-[16px] font-semibold tracking-tight text-foreground text-balance', 'Sub-section header above list rows'],
            ]}
          />
        </Section>

        {/* ─── EVILCHARTS ANALYTICS ─── */}
        <Section id="evilcharts" title="EvilCharts Analytics Architecture">
          <P>
            Scrunity integrates the **EvilCharts** visualization engine across all core project tabs:
          </P>
          <Table
            headers={['Tab Module', 'Chart Component', 'Location', 'Visualization Metric']}
            rows={[
              ['Payments', 'EChartsRadialChart', 'src/components/projects/payments/payments-radial-chart.tsx', '4 Radial Gauges: Collected, Due, Overdue, Upcoming'],
              ['Proposals', 'ProposalDonutChart', 'src/components/projects/proposal/proposal-donut-chart.tsx', 'Sales Pipeline Donut: Accepted, Sent, Draft, Declined'],
              ['Deliverables', 'EChartsAreaChart', 'src/components/projects/deliverables/deliverables-velocity-chart.tsx', 'Static Area Velocity Trend: Approved vs Total Tasks'],
              ['Contracts', 'ContractStatusChart', 'src/components/projects/contracts/contract-status-chart.tsx', '3 Radial Gauges: Fully Signed, Pending, Draft Agreements'],
              ['Activity Log', 'EChartsBarChart', 'src/components/projects/activity/activity-bar-chart.tsx', 'Monospace 14-Day Audit Bar Chart with Peak Day indicator'],
              ['Project Files', 'FilesStorageChart', 'src/components/projects/files/files-storage-chart.tsx', 'Storage Vault Breakdown: PDFs, Images, Code Archives'],
              ['Project Overview', 'ProjectOverviewMomentumChart', 'src/components/projects/overview/project-overview-momentum-chart.tsx', '14-Day Activity Velocity Trend Area Chart'],
            ]}
          />
        </Section>

        {/* ─── AI SCOPE GUARDIAN ENGINE ─── */}
        <Section id="ai-engine" title="AI Scope Guardian & Clause Engine">
          <P>
            Scrunity protects agency profit margins by automatically analyzing uploaded PDF contracts, extracting scope boundaries, evaluating revision counts, and generating Change Order SOW addendums:
          </P>
          <ul className="my-2 pl-5 text-sm text-muted-foreground leading-relaxed space-y-1 list-disc">
            <li><strong className="text-foreground font-medium">Model Fallback Architecture:</strong> Uses <Code>openai/gpt-oss-120b</Code> as the primary LLM engine on Groq with automated fallback to <Code>llama-3.3-70b-versatile</Code> if rate limits occur.</li>
            <li><strong className="text-foreground font-medium">Universal Preprocessors & Type Safety:</strong> Zero <Code>any</Code> types. Uses Zod v4 preprocessors to coerce LLM JSON variations cleanly into typed objects.</li>
            <li><strong className="text-foreground font-medium">AI Clause Inspector Drawer:</strong> Slide-over panel (<Code>ContractAIDrawer</Code>) displaying extracted scope items, exclusions, revision limits, and payment terms.</li>
            <li><strong className="text-foreground font-medium">Scope Creep Alert & Addendum Generator:</strong> <Code>ScopeGuardianPill</Code> evaluates deliverable revision counts against contract terms (<Code>within_scope</Code> | <Code>limit_reached</Code> | <Code>scope_creep_alert</Code>) and launches the AI Addendum Drafter (<Code>AddendumModal</Code>).</li>
          </ul>
        </Section>

        {/* ─── MULTI-CURRENCY ENGINE ─── */}
        <Section id="currency" title="Multi-Currency Engine (INR / USD)">
          <P>
            Scrunity supports dual currencies (<Code>INR ₹</Code> and <Code>USD $</Code>) seamlessly:
          </P>
          <ul className="my-2 pl-5 text-sm text-muted-foreground leading-relaxed space-y-1 list-disc">
            <li><strong className="text-foreground font-medium">Single Currency Formatting:</strong> Formats INR as <Code>₹1,00,000</Code> and USD as <Code>$2,500</Code> using locale rules.</li>
            <li><strong className="text-foreground font-medium">Mixed-Currency Portfolio Totals:</strong> When a project contains milestones or proposals in both INR and USD, totals are formatted as <Code>₹1,00,000 + $2,000</Code> rather than converting or collapsing currencies improperly.</li>
            <li><strong className="text-foreground font-medium">Utility Function:</strong> Implemented via <Code>formatMultiCurrencyTotals(items)</Code> in payment components.</li>
          </ul>
        </Section>

        {/* ─── DATABASE SCHEMA ─── */}
        <Section id="schema" title="Database Schema">
          <P>All tables are defined in <Code>src/db/schema.ts</Code> using Drizzle&apos;s <Code>pgTable</Code>.</P>

          <H3>Payment & Financial Tables</H3>
          <Table
            headers={['Table', 'Key Columns', 'Purpose']}
            rows={[
              ['payment_milestone', 'projectId, title, amount, currency, triggerType, status, deliverableId', 'Milestone statuses: upcoming | due | overdue | paid | waived'],
              ['payment', 'milestoneId, projectId, amount, currency, paymentMethod, referenceNote, status, paidAt', 'Stores payment verification & UTR reference notes'],
            ]}
          />

          <H3>Contract, AI Scope, Proposal & Activity Tables</H3>
          <Table
            headers={['Table', 'Key Columns', 'Purpose']}
            rows={[
              ['contract', 'projectId, fileUrl, fileName, documentType, uploadedByRole, status, signedDocumentUrl, documentHash', 'Supports sow | nda | noc | msa | addendum | other'],
              ['contract_scope_term', 'contractId, projectId, termType, title, description, maxRevisions', 'Enum: scope | exclusion | revision_limit | payment_term'],
              ['signature', 'contractId, userId, signatureData, signatureMethod, ipAddress, userAgent, documentHash', 'Bi-directional e-signature execution & cryptographic audit logs'],
              ['proposal', 'projectId, title, price, currency, status', 'Status: draft | sent | accepted | declined'],
              ['deliverable', 'projectId, title, status, dueDate, submissionTitle, submissionUrl', 'Status: pending | in_review | approved | revision_requested'],
              ['activity_log', 'projectId, userId, type, metadata', 'Audit log for contract, payment, deliverable, and member actions'],
              ['files', 'projectId, name, size, url, uploadedBy', 'Project attachments and document storage'],
            ]}
          />
        </Section>

        {/* ─── CONTRACT & SECURITY ARCHITECTURE ─── */}
        <Section id="contracts" title="Contract Vault & Security Architecture">
          <P>
            Scrunity implements defense-in-depth authorization, private document storage, and cryptographic lifecycle verification:
          </P>
          <ul className="my-2 pl-5 text-sm text-muted-foreground leading-relaxed space-y-1 list-disc">
            <li><strong className="text-foreground font-medium">Centralized Project Authorization Policy:</strong> Solves cookie vs. session <Code>activeOrganizationId</Code> mismatches using <Code>getProjectAccess(projectId, userId)</Code> in <Code>src/lib/project-auth.ts</Code>. Side-effect free; querying access never mutates database membership.</li>
            <li><strong className="text-foreground font-medium">Private Document Vault:</strong> PDF contracts and project files are uploaded using Vercel Blob <Code>access: &quot;private&quot;</Code>. Public direct URLs are prohibited; downloads pass through auth-gated proxies (<Code>/api/contracts/download</Code> &amp; <Code>/api/files/download</Code>).</li>
            <li><strong className="text-foreground font-medium">Immutable Signed Contracts:</strong> Contracts with any signature state (<Code>signed</Code>, <Code>partially_signed</Code>, <Code>fully_signed</Code>) are immutable and cannot be deleted.</li>
            <li><strong className="text-foreground font-medium">Durable Serverless Notifications:</strong> Activity logging and transactional email dispatches use Next.js 16&apos;s <Code>after()</Code> API in <Code>src/lib/activity.ts</Code> to guarantee background delivery without timing out in serverless runtimes.</li>
          </ul>
        </Section>

        {/* ─── API ─── */}
        <Section id="api" title="API Routes Specification">
          <Table
            headers={['Route', 'Method', 'Purpose']}
            rows={[
              ['/api/ai/extract-contract', 'GET/POST', 'Extract scope clauses from contract PDF via Groq AI & persist in DB'],
              ['/api/ai/check-scope', 'POST', 'Evaluate deliverable revision count against AI scope terms'],
              ['/api/ai/generate-addendum', 'POST', 'Draft itemized SOW Change Order addendum with pricing'],
              ['/api/milestones', 'GET/POST/PATCH/DELETE', 'Fetch, create, update, or delete payment milestones'],
              ['/api/milestones/mark-paid', 'POST', 'Record manual payment verification & UTR reference note'],
              ['/api/contracts', 'GET/POST/PATCH/DELETE', 'Upload agreements, fetch contracts, update status'],
              ['/api/contracts/download', 'GET', 'Auth-gated private stream proxy for downloading contract PDFs'],
              ['/api/contracts/sign', 'POST', 'Execute e-signature and generate cryptographic SHA-256 seal'],
              ['/api/deliverables', 'POST/PATCH', 'Create deliverable, update status & trigger linked milestones'],
              ['/api/deliverables/bulk', 'PATCH', 'Bulk update deliverables within a single project atomically'],
              ['/api/proposals', 'GET/POST/PATCH/DELETE', 'Manage proposals and convert line items to deliverables/milestones'],
              ['/api/files', 'POST/DELETE', 'Upload and manage project files'],
              ['/api/files/download', 'GET', 'Auth-gated private stream proxy for downloading project files'],
              ['/api/organizations/invites/accept', 'POST', 'Process and accept organization teammate invitations'],
              ['/api/projects/invites/accept', 'POST', 'Accept project invitation and sync contract signature rows'],
              ['/api/notifications', 'GET/POST', 'Fetch unread notifications & mark read'],
            ]}
          />
        </Section>

        {/* ─── ENV ─── */}
        <Section id="env" title="Environment Variables">
          <Table
            headers={['Variable', 'Required', 'Description']}
            rows={[
              ['DATABASE_URL', 'Yes', 'Neon Serverless Postgres connection string'],
              ['GROQ_API_KEY', 'Yes', 'Groq API Key for LLM model processing (gpt-oss-120b & llama-3.3-70b)'],
              ['GOOGLE_CLIENT_ID', 'Yes', 'Google OAuth client ID'],
              ['GOOGLE_CLIENT_SECRET', 'Yes', 'Google OAuth client secret'],
              ['BETTER_AUTH_SECRET', 'Yes', 'Session encryption secret'],
              ['BLOB_READ_WRITE_TOKEN', 'Yes', 'Vercel Blob storage token'],
              ['RESEND_API_KEY', 'Yes', 'Resend transactional email API key'],
            ]}
          />
        </Section>

        {/* ─── COMMANDS ─── */}
        <Section id="commands" title="Dev & Verification Commands">
          <Table
            headers={['Command', 'Description']}
            rows={[
              ['npm run dev', 'Start local development server (port 3000)'],
              ['npm run build', 'Build production bundle'],
              ['npm run typecheck', 'Execute tsc --noEmit type verification (0 errors constraint)'],
              ['npm run lint', 'Run ESLint linting check'],
              ['npm run db:push', 'Push Drizzle schema changes directly to Neon Postgres'],
            ]}
          />
        </Section>

        {/* Footer */}
        <footer className="mt-20 pt-6 border-t border-border/40 flex justify-between items-center text-[11px] text-muted-foreground">
          <span>Scrunity Internal Developer Documentation</span>
          <span className="tabular-nums">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </footer>
      </div>
    </div>
  );
}
