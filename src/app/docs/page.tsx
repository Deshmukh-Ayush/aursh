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
  Callout,
} from "./doc-components";

export const metadata: Metadata = {
  title: "Developer Docs",
  description: "Internal developer documentation for Scrunity — architecture, schema, API routes, payment milestones, and conventions.",
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
    <div className="min-h-svh bg-background text-foreground antialiased font-sans selection:bg-primary/20">
      <style dangerouslySetInnerHTML={{__html: `
        html {
          scroll-behavior: smooth;
        }
      `}} />
      
      {/* Floating nav */}
      <nav className="sticky top-0 z-50 h-13 px-6 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-[14px] font-bold tracking-tight text-foreground">Scrunity</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-lg bg-purple-500/15 text-cyan-600 dark:text-cyan-400 tracking-wider uppercase">
            Internal Docs
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">v0.0.1</span>
      </nav>

      <div className="max-w-215 mx-auto px-6 pt-12 pb-32">
        {/* Hero */}
        <header className="mb-16">
          <h1 className="text-[36px] font-extrabold tracking-tight leading-tight text-foreground mb-4 text-balance">
            Developer Documentation
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground max-w-160 text-pretty">
            Technical architecture, DB schemas, API endpoints, payment milestones, e-signature engines, and code conventions for Scrunity.
          </p>
        </header>

        {/* TOC */}
        <Section title="Contents">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {[
              ['What is Scrunity?', '#overview'],
              ['Tech Stack', '#stack'],
              ['Folder Structure', '#folders'],
              ['Database Schema', '#schema'],
              ['Payment Milestones Engine', '#payments'],
              ['Contract & E-Signature Vault', '#contracts'],
              ['Authentication', '#auth'],
              ['API Routes', '#api'],
              ['Component Architecture', '#components'],
              ['Notifications', '#notifications'],
              ['Environment Variables', '#env'],
              ['Dev Commands', '#commands'],
              ['Conventions & Design System', '#conventions'],
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
            Scrunity is an AI-powered client collaboration and revenue protection platform for agencies, freelancers, and clients. It replaces fragmented tools (DocuSign, Trello, WhatsApp, Excel invoices) with a unified source of truth.
          </P>
          <P>Key user roles:</P>
          <ul className="my-2 pl-5 text-sm text-muted-foreground leading-loose list-disc">
            <li><Code>owner</Code> — Agency owner who created the project. Full administrative control over scope, contracts, and payment tracking.</li>
            <li><Code>agency</Code> — Agency team member. Can create deliverables, send proposals, upload agreements, and record payment milestones.</li>
            <li><Code>client</Code> — Invited client stakeholder. Can upload agreements (e.g. NDA, NOC), sign contracts, review deliverables, request revisions, and verify payments.</li>
          </ul>
        </Section>

        {/* ─── TECH STACK ─── */}
        <Section id="stack" title="Tech Stack">
          <Table
            headers={['Layer', 'Technology', 'Notes']}
            rows={[
              ['Framework', 'Next.js 16 (App Router)', 'RSC by default, async params, Turbopack'],
              ['Language', 'TypeScript 5', 'Strict mode'],
              ['Database', 'Neon (Serverless Postgres)', 'Serverless driver @neondatabase/serverless'],
              ['ORM', 'Drizzle ORM', 'Schema in src/db/schema.ts, drizzle-kit push'],
              ['Auth', 'Better Auth', 'Google OAuth + organization plugin'],
              ['SaaS Merchant of Record', 'Dodo Payments', 'MoR for Scrunity SaaS subscriptions'],
              ['State Management', 'Zustand', 'Store architecture in src/store/ with persist middleware'],
              ['Animations', 'Framer Motion', 'Apple/Emil spring animations & morphing tabs'],
              ['Storage', 'Vercel Blob', 'For PDF contracts and project file uploads'],
              ['Email', 'Resend', 'Transactional emails for invites and activity notifications'],
              ['Styling', 'Tailwind CSS 4', 'Neutral monochrome palette'],
              ['Icons', 'Lucide React', ''],
              ['Toasts', 'Sonner', ''],
            ]}
          />
        </Section>

        {/* ─── FOLDER STRUCTURE ─── */}
        <Section id="folders" title="Folder Structure">
          <CodeBlock>{`src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (ThemeProvider, Sonner)
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Base styles, typography, neutral tokens
│   ├── terms/                  # Terms of Service page (MoR, refund policy, e-signatures)
│   ├── privacy/                # Privacy Policy page (analytics, encryption, disclosures)
│   │
│   ├── onboarding/             # Organization setup flow
│   ├── dashboard/              # Main dashboard (projects, financial KPIs, stats)
│   │   └── settings/           # Org & billing settings
│   ├── projects/[projectId]/   # ⬇ Project workspace
│   │   ├── layout.tsx          # Auth guard, sidebar, role resolution
│   │   ├── page.tsx            # Overview (Financials card, activity feed)
│   │   ├── payments/           # Financial KPI cards, milestone tracking & verification
│   │   ├── contract/           # Dual Contract Vault, e-signatures, preview
│   │   ├── deliverables/       # List & Kanban views
│   │   ├── files/              # File uploads & storage
│   │   ├── discussions/        # Threaded comments
│   │   ├── activity/           # Full activity log
│   │   └── settings/           # Project settings, members, invites
│   │
│   ├── api/                    # Route Handlers
│   │   ├── milestones/         # Milestone CRUD (/api/milestones)
│   │   │   └── mark-paid/      # Manual Payment Verification (/api/milestones/mark-paid)
│   │   ├── contracts/          # Contracts POST/PATCH/DELETE
│   │   ├── deliverables/       # Deliverables POST/PATCH & milestone release trigger
│   │   ├── proposals/          # Proposal generation & line items
│   │   ├── notifications/      # GET unread, POST mark-read
│   │   ├── projects/           # Projects API CRUD & Members/Invites
│   │   └── organizations/      # Orgs API CRUD & Members/Invites
│
├── store/                      # Zustand State Management Architecture
│   ├── types.ts                # Strict domain interfaces (zero any)
│   ├── ui-store.ts             # Drawers, modals & tab filters state
│   ├── proposal-store.ts       # Proposal draft & line items state
│   ├── payment-store.ts        # Payment milestones & UTR reference state
│   └── deliverable-store.ts    # Deliverables & board drag-and-drop state
│
├── components/
│   ├── project-sidebar.tsx     # Project sidebar nav with Payments link
│   ├── projects/
│   │   ├── payments/           # PaymentsViewClient, KPI bar, verification modal
│   │   ├── contracts/          # ContractVaultClient, signature modal, upload dialog
│   │   ├── deliverables/       # DeliverableList, KanbanBoard views
│   │   ├── discussions/        # CommentThread, CommentForm
│   │   └── proposal/           # ProposalBuilder, ProposalClientView
│
├── db/
│   └── schema.ts               # Drizzle table & relation definitions
│
└── lib/
    ├── auth.ts                 # Better Auth server configuration
    ├── activity.ts             # Non-blocking Activity Logger
    ├── pdf-signing.ts          # PDF E-Signature stamper & hash generator
    └── tenant-context.ts       # Unified Tenant Context Resolver`}</CodeBlock>
        </Section>

        {/* ─── DATABASE SCHEMA ─── */}
        <Section id="schema" title="Database Schema">
          <P>All tables are defined in <Code>src/db/schema.ts</Code> using Drizzle&apos;s <Code>pgTable</Code>.</P>

          <H3>Payment & Financial Tables</H3>
          <Table
            headers={['Table', 'Key Columns', 'Purpose']}
            rows={[
              ['payment_milestone', 'projectId, title, amount, currency, triggerType, status, deliverableId', 'Milestone statuses: upcoming | due | overdue | paid | waived'],
              ['payment', 'milestoneId, projectId, amount, currency, paymentMethod, referenceNote, status, paidAt', 'Stores payment receipt verification & UTR reference notes'],
            ]}
          />

          <H3>Contract & E-Signature Tables</H3>
          <Table
            headers={['Table', 'Key Columns', 'Purpose']}
            rows={[
              ['contract', 'projectId, fileUrl, fileName, documentType, uploadedByRole, status, signedDocumentUrl, documentHash', 'Supports sow | nda | noc | msa | addendum | other'],
              ['signature', 'contractId, userId, signatureData, signatureMethod, ipAddress, userAgent, documentHash, auditTrail', 'Records bi-directional e-signature execution & cryptographic audit logs'],
            ]}
          />

          <H3>Proposal & Project Tables</H3>
          <Table
            headers={['Table', 'Key Columns', 'Purpose']}
            rows={[
              ['proposal', 'projectId, title, price, currency, status', 'Status: draft | sent | accepted | declined'],
              ['proposal_line_items', 'proposalId, description, quantity, unitPrice, total', 'Line items converted to deliverables and payment milestones'],
              ['deliverable', 'projectId, title, status, dueDate, submissionTitle, submissionUrl', 'Status: pending | in_review | approved | revision_requested'],
              ['activity_log', 'projectId, userId, type, metadata', 'Includes payment_requested, payment_completed, milestone_created'],
            ]}
          />
        </Section>

        {/* ─── PAYMENT MILESTONES ─── */}
        <Section id="payments" title="Payment Milestones Engine">
          <P>
            Scrunity includes a dedicated **Payment Milestones & Financial Tracking Engine** designed for agency revenue protection:
          </P>
          <ul className="my-2 pl-5 text-sm text-muted-foreground leading-loose list-disc">
            <li><strong className="text-foreground font-medium">Trigger Types:</strong> Upfront (100% or deposit), On Deliverable Approval, Specific Due Date, or Manual Request.</li>
            <li><strong className="text-foreground font-medium">Automated Release Gate:</strong> When a client approves a deliverable via <Code>PATCH /api/deliverables</Code>, any linked milestone automatically flips from <Code>upcoming</Code> to <Code>due</Code>.</li>
            <li><strong className="text-foreground font-medium">Direct Payment Verification:</strong> Agencies verify payments with method selection (UPI/GPay, Bank Transfer, Card, Cash) and enter optional transaction UTR numbers.</li>
          </ul>
        </Section>

        {/* ─── CONTRACT VAULT ─── */}
        <Section id="contracts" title="Contract & E-Signature Vault">
          <P>
            The Contract Vault provides Apple-inspired inline document management with bi-directional upload rights:
          </P>
          <ul className="my-2 pl-5 text-sm text-muted-foreground leading-loose list-disc">
            <li><strong className="text-foreground font-medium">Bi-Directional Uploads:</strong> Agency uploads SOW/MSA $\rightarrow$ Client signs; Client uploads NDA/NOC $\rightarrow$ Agency signs.</li>
            <li><strong className="text-foreground font-medium">Cryptographic Audit Trail:</strong> Computes SHA-256 document hashes, logs IP address, user-agent, and timestamp for legal enforcement.</li>
            <li><strong className="text-foreground font-medium">Morphing Tab Bar:</strong> Framer Motion tab sliding indicator for filtering document categories.</li>
          </ul>
        </Section>

        {/* ─── API ─── */}
        <Section id="api" title="API Routes">
          <Table
            headers={['Route', 'Method', 'Purpose']}
            rows={[
              ['/api/milestones', 'GET/POST/PATCH/DELETE', 'Fetch, create, update, or delete payment milestones'],
              ['/api/milestones/mark-paid', 'POST', 'Record manual payment verification & UTR reference note'],
              ['/api/contracts', 'GET/POST/PATCH/DELETE', 'Upload agreements, fetch contracts, update status'],
              ['/api/deliverables', 'POST/PATCH', 'Create deliverable, update status & trigger linked milestones'],
              ['/api/proposals', 'POST/PATCH', 'Create proposal and convert line items to deliverables/milestones'],
              ['/api/notifications', 'GET/POST', 'Fetch unread notifications & mark read'],
              ['/api/projects', 'POST/PATCH/DELETE', 'Create, update, delete projects'],
            ]}
          />
        </Section>

        {/* ─── ENV ─── */}
        <Section id="env" title="Environment Variables">
          <Table
            headers={['Variable', 'Required', 'Description']}
            rows={[
              ['DATABASE_URL', 'Yes', 'Neon Serverless Postgres connection string'],
              ['GOOGLE_CLIENT_ID', 'Yes', 'Google OAuth client ID'],
              ['GOOGLE_CLIENT_SECRET', 'Yes', 'Google OAuth client secret'],
              ['BETTER_AUTH_SECRET', 'Yes', 'Session encryption secret'],
              ['BLOB_READ_WRITE_TOKEN', 'Yes', 'Vercel Blob storage token'],
              ['RESEND_API_KEY', 'Yes', 'Resend transactional email API key'],
            ]}
          />
        </Section>

        {/* ─── COMMANDS ─── */}
        <Section id="commands" title="Dev Commands">
          <Table
            headers={['Command', 'Description']}
            rows={[
              ['npm run dev', 'Start dev server (port 3000)'],
              ['npm run build', 'Production build'],
              ['npm run typecheck', 'tsc --noEmit (no output, just type checking)'],
              ['npm run lint', 'ESLint'],
              ['npm run db:push', 'Sync schema changes directly to Neon Postgres'],
            ]}
          />
        </Section>

        {/* Footer */}
        <footer className="mt-20 pt-6 border-t border-border/40 flex justify-between items-center text-[11px] text-muted-foreground">
          <span>Scrunity Internal Documentation</span>
          <span>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </footer>
      </div>
    </div>
  );
}
