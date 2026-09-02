# Scrunity

**Live Application:** [beta.scrunity.com](https://beta.scrunity.com)  
**Positioning:** The AI-Powered Workspace & Revenue Protection Platform for Agencies and Freelancers.

---

## 📖 What is Scrunity?

Scrunity is a modern, unified workspace that turns **signed client contracts into living, enforceable project execution environments**.

Freelancers and agencies frequently lose revenue and client trust across fragmented tools:
- ✉️ **Email / Slack:** Buried feedback, scope ambiguity, and untracked revision requests.
- ✍️ **DocuSign / HelloSign:** Isolated agreements disconnected from day-to-day deliverables.
- 📋 **Trello / Notion / Jira:** Manual project boards without contract-backed scope limits.
- 🧾 **Spreadsheets / Stripe:** Fragmented milestone invoices detached from client sign-offs.

**Scrunity unifies the entire lifecycle:** from dual e-signature contracts and automated scope compliance to milestone cashflow protection, professional invoicing, and an autonomous AI workspace co-pilot (**Torch**).

---

## ⚡ Core Platform Capabilities

### 🤖 Torch: Autonomous Workspace AI Co-Pilot
- **Real-Time Workspace Tool Calling:** Built on the Vercel AI SDK (v7 SSE streaming) and powered by Groq high-capacity reasoning models.
- **Contract Scope Guardian (`auditProjectScope`):** Parses signed PDF contracts, extracts binding terms, tracks revision histories, and triggers scope-creep alerts before out-of-scope work begins.
- **Automated Client Digests (`generateClientDigest`):** Synthesizes weekly progress, deliverable statuses, and recent activity logs into client-ready updates.
- **Interactive Drafting & Confirmation:** Drafts new deliverables (`createDeliverableDraft`) and Change Order Addenda (`generateAddendumDraft`) with human-in-the-loop confirmation before database persistence.
- **Milestone Invoice Drafting (`draftInvoiceForMilestone`):** Identifies approved milestones and drafts compliant invoices directly in chat.
- **Live Web Research (`webSearch`):** Licensed search API (Firecrawl `/v2/search` with fallback tiers) with strict boundaries separating internal workspace data from external market research.

### 💳 Organization-Level Pooled Credit Engine
- **Shared Capacity Sizing:** AI tool actions and web search credits are pooled at the organization level, sized by subscription tier and paid seat count.
- **Billing Cycle Alignment:** Synchronizes credit periods with subscription renewals (`organizationCreditPeriod`), supporting zero-rollover resets, mid-cycle tier upgrades, and clock-skew tolerance.
- **Soft-Cap & Audit Logging:** Tracks consumption without hard-blocking client workflows (`ENFORCE_CREDIT_LIMITS = false`), logging every invocation to `usageEvent`.
- **Search Circuit Breaker:** In-memory sliding-window rate limiter protecting external search platforms (60 requests/hour limit per org).
- **Billing & Usage Dashboard:** Live usage progress meters in Settings > Billing.

### 🧾 Professional Invoicing & Multi-Currency Engine
- **Vercel-Crafted Document View:** Clean, restrained typography-first document design with real-time print/PDF export.
- **Dynamic Exchange Rates:** Live currency conversions (Frankfurter API with caching and fallback chains) supporting USD, EUR, GBP, INR, CAD, AUD, and JPY.
- **Direct Payment Verification:** Record payments via UPI / GPay, Bank Wire (NEFT/IMPS), Card, or Custom Link with UTR reference verification.
- **Invoice Lifecycle:** Complete status management (`draft`, `sent`, `viewed`, `paid`, `overdue`, `void`) with automated overdue day calculations.

### 📜 Dual Contract Vault & E-Signatures
- **Bi-Directional Agreements:** Agencies upload SOWs & MSAs; Clients upload NDAs and NOCs.
- **Cryptographic Audit Trail:** SHA-256 document hashing, IP address logging, timestamping, and user-agent tracking for legal enforceability.
- **Contract-Backed Execution:** Signed contracts automatically populate project scope items and link directly to milestone payment triggers.

### 📋 Deliverable & Milestone Management (3 Views)
- **Interactive List View:** Accordion discussions, revision history, and role-based action controls.
- **dnd-kit Kanban Board:** Fluid drag-and-drop status pipeline with optimistic UI updates.
- **Timeline / Gantt View:** Visual project roadmap with interactive milestone bars and schedule tracking.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components, Turbopack)
- **Language:** TypeScript 5 (Strict Mode)
- **Database:** Neon Serverless PostgreSQL with `@neondatabase/serverless`
- **ORM:** Drizzle ORM (Schema in `src/db/schema.ts`)
- **AI Engine:** Vercel AI SDK + Groq (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`)
- **Web Search:** Firecrawl `/v2/search` (Primary) + Serper / Brave / Wikipedia (Fallbacks)
- **Authentication:** Better Auth (Google OAuth + Multi-Tenant Organizations)
- **Merchant of Record (SaaS Billing):** Dodo Payments
- **File Storage:** Vercel Blob (PDF agreements, assets, invoice documents)
- **Email Delivery:** Resend (Transactional client notifications)
- **Cache & Rate Limiting:** Upstash Redis
- **Styling & UI:** Tailwind CSS 4, Framer Motion, Radix UI primitives, Lucide / Phosphor Icons

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (or Neon Serverless Postgres instance)
- Groq API Key (for Torch AI co-pilot)
- Firecrawl API Key (for Torch live web search)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Deshmukh-Ayush/aursh.git
cd aursh
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:

```env
# App URL
BASE_URL="http://localhost:3000"

# Database (Neon Serverless Postgres)
DATABASE_URL="postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require"

# Auth (Better Auth & Google OAuth)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
AUTH_SECRET="your-auth-secret"
BETTER_AUTH_SECRET="your-better-auth-secret"
BETTER_AUTH_URL="http://localhost:3000"

# Storage & Email
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
RESEND_API_KEY="re_..."
EMAIL_FROM="Scrunity <noreply@mail.scrunity.com>"

# AI Inference (Groq)
GROQ_API_KEY="gsk_..."

# Web Search (Firecrawl)
FIRECRAWL_API_KEY="fc-..."

# Redis Cache (Upstash)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# SaaS Billing (Dodo Payments MoR)
DODO_PAYMENTS_API_KEY="DBP_..."
DODO_PAYMENTS_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_DODO_FREELANCER_PRICE_ID="pdt_..."
NEXT_PUBLIC_DODO_AGENCY_PRICE_ID="pdt_..."
NEXT_PUBLIC_BYPASS_BILLING=false
```

### 3. Run Database Migrations
```bash
npm run db:migrate
```

> **Database Schema Protocol:**  
> All schema modifications must be versioned. Do NOT use `db:push` in production.  
> 1. Update `src/db/schema.ts`  
> 2. Run `npm run db:generate` to produce a numbered SQL migration  
> 3. Run `npm run db:migrate` to safely apply migrations via `__drizzle_migrations`

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 🛠️ Developer Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local Next.js dev server on port 3000 |
| `npm run build` | Builds the production bundle |
| `npm run start` | Runs the production Next.js server |
| `npm run typecheck` | Validates TypeScript with `tsc --noEmit` |
| `npm run lint` | Runs ESLint analysis |
| `npm run db:generate` | Generates a versioned SQL migration from `src/db/schema.ts` |
| `npm run db:migrate` | Safely applies pending SQL migrations via Drizzle migrator |
| `npm run db:studio` | Opens Drizzle Studio database viewer |
| `npm run db:push` | *(Dev only)* Direct schema push (avoid in production) |

---

## 📚 Documentation Index

- **Developer Docs (`/docs`):** Internal technical documentation covering architecture, Torch AI agent co-pilot, Billing OS, pooled credit engine, team workflows, and DB schema.
- **Execution Architecture (`/docs/execution`):** End-to-end data flow funnels, API route specifications, database mutations, and master user action matrix.

---

## 📜 Guiding Principle

> **"What exactly did both parties agree to?"**
>
> Every file, deadline, approval, revision, payment milestone, and deliverable must be traceable back to the signed agreement. The contract is the source of truth. Everything else is built around it.

---

## 📄 License & Compliance

© 2026 Scrunity. All rights reserved.  
Hosted live at [beta.scrunity.com](https://beta.scrunity.com). Refer to [Terms of Service](https://beta.scrunity.com/terms) and [Privacy Policy](https://beta.scrunity.com/privacy) for Merchant of Record disclosures and legal terms.
