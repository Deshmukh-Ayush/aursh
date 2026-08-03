# Scrunity

**Website:** Scrunity.sh

## What is Scrunity?

Scrunity is an open-source client collaboration platform for agencies, freelancers, and their clients.

The goal of Scrunity is to replace the fragmented workflow currently spread across multiple tools such as:

- Email
- WhatsApp
- Slack
- Google Drive
- Google Docs
- DocuSign
- Trello
- Notion

Scrunity provides a single shared workspace where both parties can manage the entire lifecycle of a project from agreement to delivery.

---

## Problem Statement

Agencies and freelancers typically manage client work using several disconnected tools. This creates several problems:

- Information is scattered
- Deliverables are unclear
- Project scope becomes disputed
- Deadlines are difficult to track
- Files are spread across multiple systems
- Communication is fragmented

Scrunity aims to centralize the entire workflow.

---

## Vision

Scrunity is not just a document-signing platform.

Scrunity is a shared project workspace where agreements become projects. The signed agreement should become the source of truth for:

- Scope
- Deliverables
- Deadlines
- Files
- Communication
- Project history

---

## Target Users

### Agencies
Agencies and freelancers can:
- Create projects
- Invite clients
- Upload contracts
- Manage deliverables
- Share files
- Track project progress

### Clients
Clients can:
- Join projects
- Review contracts
- Sign agreements
- Upload files
- Review deliverables
- Request revisions
- Approve completed work

---

## Core Workflow

1. **Create Project**: Agency or freelancer creates a new project.
2. **Invite Client**: Client receives an invitation and gains access to the project.
3. **Contract**: The project owner uploads a contract PDF.
4. **Signing**: Both parties review and sign the contract. A signed contract becomes immutable.
5. **Timeline**: After signatures, a timeline will be created according to which deliverables should be given.
6. **Workspace Activation**: After all signatures are completed, the project workspace becomes active (Overview, Contract, Files, Deliverables, Timeline, Activity Log, Discussions).
7. **Collaboration**: Both parties can upload files, share links, leave comments, and track progress.
8. **Deliverables**: Projects contain deliverables with status, due date, description, and comments.
9. **Review & Approval**: Clients can approve deliverables or request revisions. All actions are logged.
10. **Project Completion**: After all deliverables are approved, the project can be marked as completed.

---

## MVP Scope

The first version focuses only on the essentials:

- **Authentication**: Better Auth (Google provider), Organization support.
- **Projects**: Create project, Invite members, Archive project.
- **Contracts**: Upload PDF, Request signatures, Track signature status.
- **Files**: Upload files, Download files, Basic organization.
- **Deliverables**: Checklist system, Status tracking, Due dates.
- **Discussions**: Comment threads, Project updates.
- **Activity Log**: Track important events (contract signed, file uploaded, etc.).

---

## Guiding Principle

> "What exactly did both parties agree to?"

Every file, comment, deadline, approval, revision, and deliverable should be traceable back to the original agreement. The agreement is the source of truth. Everything else is built around it.

---

## Tech Stack

- **Framework:** Next.js
- **Database:** Neon (Serverless Postgres), Drizzle ORM
- **Authentication:** Better Auth
- **Styling:** Tailwind CSS (v4)
- **UI Components:** Shadcn, Radix UI, Lucide React
