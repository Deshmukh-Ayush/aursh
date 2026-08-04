# Scrunity

**Website:** [beta.scrunity.com](https://beta.scrunity.com)  
**Positioning:** The AI-Powered Client Collaboration & Revenue Protection Platform for Agencies & Freelancers.

---

## What is Scrunity?

Scrunity is a modern, unified workspace that bridges the gap between **contract agreements**, **project execution**, and **revenue protection**.

Instead of scattering client collaboration across 7 disconnected tools:
- ✉️ Email (misplaced feedback)
- 💬 WhatsApp / Slack (informal scope requests)
- 📁 Google Drive / Dropbox (file version chaos)
- ✍️ DocuSign / HelloSign (isolated contracts)
- 📋 Trello / Notion (manual task tracking)
- 🧾 Excel (fragmented milestone invoicing)

**Scrunity turns signed contracts into living project workspaces.** The agreed Statement of Work (SOW) serves as the single source of truth for scope, deliverables, payment milestones, files, and project execution.

---

## ⚡ Key Features

### 🛡️ Revenue Protection & Payment Milestones
- **Financial KPI Cards**: Track Total Project Value, Collected Revenue (with progress bar), Outstanding Balance, and Overdue milestones.
- **Automated Approval Triggers**: Approving a deliverable automatically flips linked payment milestones from `upcoming` to `due`.
- **Direct Agency Verification**: Record payments via UPI / GPay / PhonePe, Bank Transfer (NEFT/IMPS), Card, or Custom Link with transaction UTR reference logging.
- **Dodo Payments MoR**: Merchant of Record integration for Scrunity SaaS subscription billing ($9/mo Freelancer, $19/mo Agency).

### 📜 Dual Contract & E-Signature Vault
- **Bi-Directional Document Uploading**: Agencies upload Statements of Work (SOW) & Master Services Agreements (MSA); Clients upload NDAs and NOCs.
- **Apple & Emil Inspired UI**: Inline document lists, neutral monochrome styling, and Framer Motion sliding tab highlight pills.
- **Cryptographic Audit Trail**: SHA-256 document hashing, IP address logging, timestamping, and user-agent tracking for legal enforceability.

### 📋 Deliverable & Scope Management (3 Views)
- **Interactive List View**: Card-based deliverable list with accordion discussions and role-based action controls.
- **dnd-kit Kanban Board**: Drag-and-drop status pipeline with optimistic UI updates.
- **HTML/CSS Timeline Gantt**: Visual project schedule with clickable timeline bars and detail modals.

### 💬 Threaded Discussions & Non-Blocking Activity Stream
- Contextual comment threads linked directly to specific deliverables or general project topics.
- Non-blocking activity logging with Resend transactional email dispatches and SWR in-app notifications.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, RSC by default, Turbopack)
- **Language:** TypeScript 5 (Strict Mode)
- **Database:** Neon (Serverless Postgres) with `@neondatabase/serverless`
- **ORM:** Drizzle ORM (Schema in `src/db/schema.ts`)
- **Auth:** Better Auth (Google OAuth provider + Organization plugin)
- **SaaS Merchant of Record:** Dodo Payments
- **Animations:** Framer Motion (Spring physics & layoutId morphing)
- **Storage:** Vercel Blob (PDF contracts & project files)
- **Email:** Resend (Transactional emails)
- **Styling:** Tailwind CSS 4 (Neutral monochrome design system)
- **Drag & Drop:** `dnd-kit`

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- PostgreSQL database (or Neon Serverless Postgres instance)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Deshmukh-Ayush/aursh.git
cd aursh
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://user:password@ep-xyz.neon.tech/scrunity?sslmode=require"

# Auth (Better Auth)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
BETTER_AUTH_SECRET="your-session-secret"
BETTER_AUTH_URL="http://localhost:3000"

# Storage & Email
BLOB_READ_WRITE_TOKEN="vercel-blob-token"
RESEND_API_KEY="re_123456789"
```

### 3. Push Database Schema
```bash
npm run db:push
```

### 4. Run Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Developer Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts dev server on port 3000 |
| `npm run build` | Builds production bundle |
| `npm run typecheck` | Runs `tsc --noEmit` typecheck |
| `npm run lint` | Runs ESLint verification |
| `npm run db:push` | Pushes schema changes directly to Neon Postgres |

---

## 📜 Guiding Principle

> **"What exactly did both parties agree to?"**
>
> Every file, deadline, approval, revision, payment milestone, and deliverable must be traceable back to the signed agreement. The contract is the source of truth. Everything else is built around it.

---

## 📄 License & Compliance

© {new Date().getFullYear()} Scrunity. All rights reserved.  
Hosted live at [beta.scrunity.com](https://beta.scrunity.com). Refer to [Terms of Service](https://beta.scrunity.com/terms) and [Privacy Policy](https://beta.scrunity.com/privacy) for Merchant of Record disclosures and legal terms.
