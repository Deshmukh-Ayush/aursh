import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
      <nav className="sticky top-0 z-50 h-[52px] px-6 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-[14px] font-bold tracking-tight text-foreground">Scrunity</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-purple-500/15 text-purple-600 dark:text-purple-400 tracking-wider uppercase">
            Internal Docs
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">v0.0.1</span>
      </nav>

      <div className="max-w-[860px] mx-auto px-6 pt-12 pb-32">
        {/* Hero */}
        <header className="mb-16">
          <h1 className="text-[36px] font-extrabold tracking-tight leading-tight text-foreground mb-4 text-balance">
            Developer Documentation
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground max-w-[640px] text-pretty">
            Everything you need to know before writing your first line of code. Architecture, conventions, database schema, and patterns.
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
              ['Authentication', '#auth'],
              ['Server Actions', '#actions'],
              ['API Routes', '#api'],
              ['Components', '#components'],
              ['Notifications', '#notifications'],
              ['Environment Variables', '#env'],
              ['Dev Commands', '#commands'],
              ['Conventions', '#conventions'],
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
            Scrunity is a client-contractor project management platform. Agencies create organizations, invite clients to specific projects, manage deliverables, share files, sign contracts, and track progress — all in one workspace.
          </P>
          <P>Key user roles:</P>
          <ul className="my-2 pl-5 text-sm text-muted-foreground leading-loose list-disc">
            <li><Code>owner</Code> — The agency user who created the project. Full permissions.</li>
            <li><Code>client</Code> — Invited user. Can submit deliverables for review, sign contracts, leave comments.</li>
            <li><Code>agency</Code> — Implicit role for org members who aren&apos;t explicit project members.</li>
          </ul>
        </Section>

        {/* ─── TECH STACK ─── */}
        <Section id="stack" title="Tech Stack">
          <Table
            headers={['Layer', 'Technology', 'Notes']}
            rows={[
              ['Framework', 'Next.js 16 (App Router)', 'RSC by default, async params'],
              ['Language', 'TypeScript 5', 'Strict mode'],
              ['Database', 'Neon (Postgres)', 'Serverless driver @neondatabase/serverless'],
              ['ORM', 'Drizzle ORM', 'Schema in src/db/schema.ts, push-based migrations'],
              ['Auth', 'Better Auth', 'Google OAuth + organization plugin'],
              ['Storage', 'Vercel Blob', 'For contracts and file uploads'],
              ['Email', 'Resend', 'Transactional emails (invites, notifications)'],
              ['Styling', 'Tailwind CSS 4', 'With shadcn/ui components'],
              ['Charts', 'Recharts', 'Area charts, pie charts on dashboard'],
              ['Drag & Drop', 'dnd-kit', 'Kanban board for deliverables'],
              ['Icons', 'Lucide React', ''],
              ['Toasts', 'Sonner', ''],
              ['Data Fetching', 'SWR', 'Client-side polling (notifications)'],
            ]}
          />
        </Section>

        {/* ─── FOLDER STRUCTURE ─── */}
        <Section id="folders" title="Folder Structure">
          <CodeBlock>{`src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (ThemeProvider, Sonner)
│   ├── page.tsx                # Landing page (redirects to /dashboard)
│   ├── globals.css             # Design tokens, base styles, utilities
│   │
│   ├── sign-in/                # Auth page (Google OAuth)
│   ├── onboarding/             # Post-signup org creation flow
│   ├── dashboard/              # Main dashboard (project list, org management)
│   ├── invite/                 # Project invite accept page
│   │
│   ├── projects/[projectId]/   # ⬇ Project workspace (sidebar layout)
│   │   ├── layout.tsx          # Auth guard, sidebar, role resolution
│   │   ├── mobile-header.tsx   # Sheet-based mobile nav
│   │   ├── page.tsx            # Overview (KPIs, chart, activity feed)
│   │   ├── contract/           # Contract upload, view, sign
│   │   ├── deliverables/       # List, Kanban, Timeline views
│   │   ├── files/              # File uploads & downloads
│   │   ├── discussions/        # Threaded comments
│   │   ├── activity/           # Full activity log
│   │   └── settings/           # Project settings, members, invites
│   │
│   ├── actions/                # ⬇ Server Actions ("use server")
│   │   ├── comment.ts          # addComment
│   │   ├── contract.ts         # uploadContract, signContract
│   │   ├── deliverable.ts      # createDeliverable, updateStatus
│   │   ├── file.ts             # uploadFile, deleteFile
│   │   ├── invite.ts           # sendProjectInvite, acceptInvite
│   │   ├── organization.ts     # createOrg, updateBranding
│   │   ├── project.ts          # createProject, getProjects
│   │   └── project-settings.ts # updateProject, markComplete
│   │
│   └── api/                    # Route Handlers
│       ├── auth/[...all]/      # Better Auth catch-all
│       └── notifications/      # GET unread, POST mark-read
│
├── components/
│   ├── ui/                     # shadcn/ui primitives (Button, Card, etc.)
│   ├── project-sidebar.tsx     # Workspace sidebar nav
│   ├── org-selector.tsx        # Org switcher dropdown
│   ├── create-project-dialog.tsx
│   ├── theme-provider.tsx
│   └── projects/               # ⬇ Project-specific components
│       ├── contracts/          # ContractViewer, UploadForm, SignButton
│       ├── deliverables/       # DeliverableList, KanbanBoard, TimelineView
│       ├── discussions/        # CommentThread, CommentForm
│       ├── files/              # FileUploader, FileList
│       ├── settings/           # MembersTable, InviteForm
│       ├── contract-banner.tsx
│       ├── mark-complete-button.tsx
│       ├── timeline-area-chart.tsx
│       ├── progress-chart.tsx
│       └── topbar-notifications.tsx
│
├── db/
│   └── schema.ts               # All Drizzle table + relation definitions
│
├── lib/
│   ├── auth.ts                 # Better Auth server config
│   ├── auth-client.ts          # Better Auth client config
│   ├── email.ts                # Resend email helpers
│   ├── activity.ts             # logActivity() helper
│   ├── notifications.ts        # createNotification() helper
│   └── utils.ts                # cn() classname merger
│
└── utils/
    └── db.ts                   # Drizzle client (neon serverless)`}</CodeBlock>
        </Section>

        {/* ─── DATABASE SCHEMA ─── */}
        <Section id="schema" title="Database Schema">
          <P>All tables are defined in <Code>src/db/schema.ts</Code> using Drizzle&apos;s <Code>pgTable</Code>. There are no migration files — we use <Code>drizzle-kit push</Code> to sync schema changes directly.</P>

          <H3>Auth Tables (managed by Better Auth)</H3>
          <Table
            headers={['Table', 'Purpose']}
            rows={[
              ['user', 'User accounts (id, name, email, image)'],
              ['session', 'Login sessions with activeOrganizationId'],
              ['account', 'OAuth provider links (Google)'],
              ['verification', 'Email verification tokens'],
            ]}
          />

          <H3>Organization Tables</H3>
          <Table
            headers={['Table', 'Purpose']}
            rows={[
              ['organization', 'Agencies. Has plan (free/paid), logoUrl, brandColor'],
              ['member', 'Org members with role (owner/admin/member)'],
              ['invitation', 'Org-level invites'],
              ['team / team_member', 'Team grouping within orgs (optional)'],
            ]}
          />

          <H3>Project Tables</H3>
          <Table
            headers={['Table', 'Key Columns', 'Notes']}
            rows={[
              ['project', 'name, organizationId, status, createdBy', 'Status: active | completed'],
              ['project_member', 'projectId, userId, role', 'Role: owner | client | agency'],
              ['project_invitation', 'projectId, email, token, status', 'Token-based invite links'],
              ['contract', 'projectId, fileUrl, fileName, status', 'Status: draft | pending_signature | signed'],
              ['signature', 'contractId, userId, signedAt', 'Each party signs separately'],
              ['deliverable', 'projectId, title, status, dueDate', 'Status: pending | in_review | approved | revision_requested'],
              ['comment', 'projectId, deliverableId?, userId, body', 'deliverableId nullable for general discussions'],
              ['files', 'projectId, name, url, size, mimeType', 'Stored on Vercel Blob'],
              ['activity_log', 'projectId, userId, type, metadata', '11 event types, JSONB metadata'],
              ['notification', 'userId, projectId, type, message, read', 'Per-user, matches activity_log types'],
            ]}
          />

          <H3>Entity Relationship</H3>
          <CodeBlock>{`Organization ─┬── has many → Project
              │                 ├── has many → ProjectMember
              │                 ├── has many → Deliverable ── has many → Comment
              │                 ├── has many → Contract ── has many → Signature
              │                 ├── has many → Files
              │                 ├── has many → ActivityLog
              │                 └── has many → Notification
              │
              └── has many → Member (org-level)
                              └── belongs to → User`}</CodeBlock>
        </Section>

        {/* ─── AUTH ─── */}
        <Section id="auth" title="Authentication">
          <P>Auth is handled by <Code>better-auth</Code> with the <Code>organization</Code> plugin.</P>
          <ul className="my-2 pl-5 text-sm text-muted-foreground leading-loose list-disc">
            <li><strong className="text-foreground font-medium">Server-side:</strong> <Code>auth.api.getSession({'{ headers }'})</Code> — used in every server component/action</li>
            <li><strong className="text-foreground font-medium">Client-side:</strong> <Code>authClient</Code> from <Code>better-auth/react</Code> — for <Code>signOut()</Code>, <Code>useSession()</Code></li>
            <li><strong className="text-foreground font-medium">Provider:</strong> Google OAuth only (no email/password)</li>
            <li><strong className="text-foreground font-medium">Route guard:</strong> Layout at <Code>projects/[projectId]/layout.tsx</Code> checks membership</li>
          </ul>
          <Callout>
            There is no middleware.ts. Auth checks are done in individual layouts and server actions.
          </Callout>
        </Section>

        {/* ─── SERVER ACTIONS ─── */}
        <Section id="actions" title="Server Actions">
          <P>All mutations go through server actions in <Code>src/app/actions/</Code>. Every action follows the same pattern:</P>
          <CodeBlock>{`"use server";
// 1. Get session
// 2. Validate inputs
// 3. Check permissions (role-based)
// 4. Mutate database
// 5. logActivity() — writes to activity_log
// 6. createNotification() — writes to notification table
// 7. revalidatePath() — bust Next.js cache
// 8. Return { success } or { error }`}</CodeBlock>

          <Table
            headers={['File', 'Key Exports']}
            rows={[
              ['comment.ts', 'addCommentAction(projectId, body, deliverableId?)'],
              ['contract.ts', 'uploadContractAction(formData), signContractAction(contractId)'],
              ['deliverable.ts', 'createDeliverableAction(formData), updateDeliverableStatusAction(id, status, comment?)'],
              ['file.ts', 'uploadFileAction(formData), deleteFileAction(fileId)'],
              ['invite.ts', 'sendProjectInviteAction(projectId, email, role), acceptInviteAction(token)'],
              ['organization.ts', 'createOrganizationAction(name, slug), updateOrgBrandingAction(...)'],
              ['project.ts', 'createProjectAction(name), getProjectsAction()'],
              ['project-settings.ts', 'updateProjectAction(id, data), markProjectCompleteAction(id)'],
            ]}
          />
        </Section>

        {/* ─── API ─── */}
        <Section id="api" title="API Routes">
          <Table
            headers={['Route', 'Method', 'Purpose']}
            rows={[
              ['/api/auth/[...all]', 'ALL', 'Better Auth catch-all (OAuth, session, org management)'],
              ['/api/notifications', 'GET', 'Fetch unread notifications for current user'],
              ['/api/notifications/read', 'POST', 'Mark one or all notifications as read'],
            ]}
          />
        </Section>

        {/* ─── COMPONENTS ─── */}
        <Section id="components" title="Component Architecture">
          <P>Components are organized by feature domain, not by type.</P>
          <H3>Deliverables (3 view modes)</H3>
          <Table
            headers={['Component', 'Description']}
            rows={[
              ['DeliverablesContainer', 'Client component — view toggle (List/Board/Timeline), persists to localStorage'],
              ['DeliverableList', 'Card-based list with accordion comments'],
              ['KanbanBoard', 'dnd-kit drag-and-drop board with 4 status columns'],
              ['TimelineView', 'HTML/CSS Gantt chart with clickable bars + detail dialog'],
              ['DeliverableActions', 'Status transition buttons (respects role permissions)'],
              ['CreateDeliverableDialog', 'Form dialog for new deliverables'],
            ]}
          />

          <H3>Key Patterns</H3>
          <ul className="my-2 pl-5 text-sm text-muted-foreground leading-loose list-disc">
            <li><strong className="text-foreground font-medium">Server Components by default</strong> — pages fetch data directly from the DB</li>
            <li><strong className="text-foreground font-medium">&quot;use client&quot; only when needed</strong> — interactivity, SWR, useState, event handlers</li>
            <li><strong className="text-foreground font-medium">Optimistic updates</strong> — Kanban board updates locally then confirms with server</li>
            <li><strong className="text-foreground font-medium">Role-based UI</strong> — actions show/hide based on <Code>memberRole</Code> prop</li>
          </ul>
        </Section>

        {/* ─── NOTIFICATIONS ─── */}
        <Section id="notifications" title="Notification System">
          <P>Notifications are created alongside every <Code>logActivity()</Code> call. They are stored per-user and scoped to projects.</P>
          <CodeBlock>{`// In any server action:
await logActivity(projectId, userId, "deliverable_approved", { title });
await createNotification(
  recipientUserId,
  projectId,
  "deliverable_approved",
  \`Your deliverable "\${title}" was approved\`
);`}</CodeBlock>
          <P>The sidebar polls <Code>/api/notifications</Code> every 30 seconds via SWR, and on window focus. Badge counts are computed client-side by filtering notification types per tab.</P>
        </Section>

        {/* ─── ENV ─── */}
        <Section id="env" title="Environment Variables">
          <Table
            headers={['Variable', 'Required', 'Description']}
            rows={[
              ['DATABASE_URL', 'Yes', 'Neon Postgres connection string'],
              ['GOOGLE_CLIENT_ID', 'Yes', 'Google OAuth client ID'],
              ['GOOGLE_CLIENT_SECRET', 'Yes', 'Google OAuth client secret'],
              ['BETTER_AUTH_SECRET', 'Yes', 'Session encryption secret'],
              ['BETTER_AUTH_URL', 'No', 'Override base URL (auto-detected on Vercel)'],
              ['BLOB_READ_WRITE_TOKEN', 'Yes', 'Vercel Blob storage token'],
              ['RESEND_API_KEY', 'Yes', 'Resend email API key'],
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
              ['npm run format', 'Prettier format all .ts/.tsx'],
              ['npm run db:push', 'Push schema changes to Neon (no migration files)'],
              ['npm run db:generate', 'Generate migration SQL (if needed)'],
              ['npm run db:studio', 'Open Drizzle Studio (visual DB browser)'],
            ]}
          />
        </Section>

        {/* ─── CONVENTIONS ─── */}
        <Section id="conventions" title="Conventions & Patterns">
          <H3>File Naming</H3>
          <ul className="my-2 pl-5 text-sm text-muted-foreground leading-loose list-disc">
            <li>Components: <Code>kebab-case.tsx</Code> (e.g. <Code>kanban-board.tsx</Code>)</li>
            <li>Server actions: <Code>kebab-case.ts</Code> in <Code>src/app/actions/</Code></li>
            <li>Pages: <Code>page.tsx</Code> in the route segment directory</li>
            <li>Layouts: <Code>layout.tsx</Code> — wrap child routes with shared UI</li>
          </ul>

          <H3>Styling Rules</H3>
          <ul className="my-2 pl-5 text-sm text-muted-foreground leading-loose list-disc">
            <li><strong className="text-foreground font-medium">Shadows over borders</strong> — use layered <Code>box-shadow</Code> instead of <Code>border</Code></li>
            <li><strong className="text-foreground font-medium">Concentric border radius</strong> — inner = outer − padding</li>
            <li><strong className="text-foreground font-medium">Tabular numbers</strong> — <Code>tabular-nums</Code> on all dynamic counts</li>
            <li><strong className="text-foreground font-medium">Scale on press</strong> — <Code>active:scale-[0.96]</Code> on clickable elements</li>
            <li><strong className="text-foreground font-medium">Never transition: all</strong> — specify exact properties</li>
            <li><strong className="text-foreground font-medium">Text wrapping</strong> — <Code>text-wrap: balance</Code> on headings, <Code>pretty</Code> on body</li>
            <li><strong className="text-foreground font-medium">13px body text</strong> — the app uses <Code>text-[13px]</Code> as the standard body size</li>
          </ul>

          <H3>Data Flow</H3>
          <CodeBlock>{`Page (RSC)              → fetches data from DB via Drizzle
  └── Client Component  → receives data as props
        └── Server Action → mutates DB, logs activity, creates notification
              └── revalidatePath() → refreshes the page`}</CodeBlock>

          <H3>Role Permissions Matrix</H3>
          <Table
            headers={['Action', 'Owner', 'Client', 'Agency']}
            rows={[
              ['Create deliverables', '✓', '—', '—'],
              ['Submit for review', '—', '✓', '—'],
              ['Approve deliverables', '✓', '—', '—'],
              ['Request revision', '✓', '—', '—'],
              ['Upload contract', '✓', '—', '—'],
              ['Sign contract', '✓', '✓', '—'],
              ['Upload files', '✓', '✓', '—'],
              ['Add comments', '✓', '✓', '—'],
              ['Mark project complete', '✓', '—', '—'],
              ['Manage settings', '✓', '—', '—'],
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

// ─── Sub-components (pure HTML/CSS via Tailwind) ───

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="text-[20px] font-bold tracking-tight text-foreground mb-4 pb-2.5 border-b border-border/40">
        {title}
      </h2>
      {children}
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[14px] font-semibold text-foreground/90 mt-6 mb-2 tracking-tight">
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] leading-[1.75] text-muted-foreground mb-3 text-pretty">
      {children}
    </p>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-[12.5px] font-mono bg-muted/50 px-1.5 py-0.5 rounded-md text-foreground">
      {children}
    </code>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="text-[12.5px] font-mono bg-muted/20 border border-border/40 rounded-[10px] p-4 overflow-x-auto leading-[1.7] text-foreground/90 my-3">
      <code>{children}</code>
    </pre>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-3 rounded-[10px] border border-border/40">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="text-left py-2.5 px-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80 border-b border-border/40 bg-muted/10 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="group hover:bg-muted/10 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className={`py-2 px-3.5 ${ri < rows.length - 1 ? 'border-b border-border/30' : ''} ${ci === 0 ? 'text-foreground font-medium whitespace-nowrap font-mono text-[12.5px]' : 'text-muted-foreground text-[13px]'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[13px] leading-[1.6] text-amber-600 dark:text-amber-500">
      <strong className="font-semibold text-amber-700 dark:text-amber-400">Note: </strong>
      <span className="text-amber-700/80 dark:text-amber-400/80">{children}</span>
    </div>
  );
}
