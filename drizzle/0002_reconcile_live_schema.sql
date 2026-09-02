CREATE TABLE "contract_scope_term" (
	"id" text PRIMARY KEY NOT NULL,
	"contract_id" text NOT NULL,
	"project_id" text NOT NULL,
	"term_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"max_revisions" integer,
	"extracted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"milestone_id" text,
	"invoice_number" text NOT NULL,
	"prefix" text DEFAULT 'INV-' NOT NULL,
	"serial_number" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"theme_color" text DEFAULT '#00AAF7' NOT NULL,
	"invoice_date" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp NOT NULL,
	"payment_terms" text,
	"company_snapshot" jsonb NOT NULL,
	"client_snapshot" jsonb NOT NULL,
	"billing_details" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"additional_terms" text,
	"payment_information" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"paid_at" timestamp,
	"pdf_url" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_defaults" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"default_prefix" text DEFAULT 'INV-' NOT NULL,
	"next_serial" integer DEFAULT 1 NOT NULL,
	"company_name" text,
	"company_address" text,
	"company_email" text,
	"company_phone" text,
	"logo_url" text,
	"signature_url" text,
	"default_payment_info" jsonb,
	"default_notes" text,
	"default_terms" text,
	"default_custom_fields" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_line_item" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"item_name" text NOT NULL,
	"description" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"line_total" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_credit_period" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"ai_credits_allotted" integer DEFAULT 0 NOT NULL,
	"ai_credits_used" integer DEFAULT 0 NOT NULL,
	"search_credits_allotted" integer DEFAULT 0 NOT NULL,
	"search_credits_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"milestone_id" text NOT NULL,
	"project_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"payment_method" text DEFAULT 'upi',
	"reference_note" text,
	"dodo_payment_id" text,
	"dodo_checkout_id" text,
	"status" text DEFAULT 'succeeded' NOT NULL,
	"paid_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_milestone" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"proposal_id" text,
	"deliverable_id" text,
	"title" text NOT NULL,
	"description" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"trigger_type" text DEFAULT 'manual' NOT NULL,
	"due_date" timestamp,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_event" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"type" text NOT NULL,
	"tool_name" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace" DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP TABLE IF EXISTS "workspace" CASCADE;
--> statement-breakpoint
ALTER TABLE "activity_log" DROP CONSTRAINT "activity_log_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "comment" DROP CONSTRAINT "comment_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "deliverable" DROP CONSTRAINT "deliverable_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_uploaded_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "invitation" DROP CONSTRAINT "invitation_inviter_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "project" DROP CONSTRAINT IF EXISTS "project_workspace_id_workspace_id_fk";
--> statement-breakpoint
ALTER TABLE "project" DROP CONSTRAINT "project_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "project_invitation" DROP CONSTRAINT "project_invitation_invited_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "proposal" DROP CONSTRAINT "proposal_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "signature" DROP CONSTRAINT "signature_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "comment" ALTER COLUMN "user_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "deliverable" ALTER COLUMN "created_by" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "uploaded_by" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "invitation" ALTER COLUMN "inviter_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "invitation" ALTER COLUMN "status" SET DEFAULT 'pending';
--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "created_by" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "project_invitation" ALTER COLUMN "invited_by" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "proposal" ALTER COLUMN "created_by" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "signature" ALTER COLUMN "user_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "contract" ADD COLUMN "document_type" text DEFAULT 'sow' NOT NULL;
--> statement-breakpoint
ALTER TABLE "contract" ADD COLUMN "uploaded_by_role" text DEFAULT 'agency' NOT NULL;
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "dodo_customer_id" text;
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "dodo_subscription_id" text;
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "subscription_status" text;
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "trial_ends_at" timestamp;
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "current_period_end" timestamp;
--> statement-breakpoint
ALTER TABLE "project_invitation" ADD COLUMN "role" text DEFAULT 'client' NOT NULL;
--> statement-breakpoint
ALTER TABLE "contract_scope_term" ADD CONSTRAINT "contract_scope_term_contract_id_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contract"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "contract_scope_term" ADD CONSTRAINT "contract_scope_term_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_milestone_id_payment_milestone_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."payment_milestone"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invoice_defaults" ADD CONSTRAINT "invoice_defaults_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invoice_line_item" ADD CONSTRAINT "invoice_line_item_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_credit_period" ADD CONSTRAINT "organization_credit_period_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_milestone_id_payment_milestone_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."payment_milestone"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment_milestone" ADD CONSTRAINT "payment_milestone_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment_milestone" ADD CONSTRAINT "payment_milestone_deliverable_id_deliverable_id_fk" FOREIGN KEY ("deliverable_id") REFERENCES "public"."deliverable"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment_milestone" ADD CONSTRAINT "payment_milestone_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "usage_event" ADD CONSTRAINT "usage_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "usage_event" ADD CONSTRAINT "usage_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "cst_contract_idx" ON "contract_scope_term" USING btree ("contract_id");
--> statement-breakpoint
CREATE INDEX "cst_project_idx" ON "contract_scope_term" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX "invoice_project_idx" ON "invoice" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX "invoice_org_idx" ON "invoice" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "invoice_milestone_idx" ON "invoice" USING btree ("milestone_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_org_number_unique" ON "invoice" USING btree ("organization_id","invoice_number");
--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_defaults_org_unique" ON "invoice_defaults" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "invoice_item_invoice_idx" ON "invoice_line_item" USING btree ("invoice_id");
--> statement-breakpoint
CREATE INDEX "org_credit_period_org_idx" ON "organization_credit_period" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "org_credit_period_dates_idx" ON "organization_credit_period" USING btree ("period_start","period_end");
--> statement-breakpoint
CREATE INDEX "pay_milestone_idx" ON "payment" USING btree ("milestone_id");
--> statement-breakpoint
CREATE INDEX "pay_project_idx" ON "payment" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX "pay_milestone_project_idx" ON "payment_milestone" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX "pay_milestone_proposal_idx" ON "payment_milestone" USING btree ("proposal_id");
--> statement-breakpoint
CREATE INDEX "pay_milestone_deliv_idx" ON "payment_milestone" USING btree ("deliverable_id");
--> statement-breakpoint
CREATE INDEX "usage_event_org_idx" ON "usage_event" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "usage_event_created_idx" ON "usage_event" USING btree ("created_at");
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "deliverable" ADD CONSTRAINT "deliverable_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_invitation" ADD CONSTRAINT "project_invitation_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "signature" ADD CONSTRAINT "signature_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "activity_user_idx" ON "activity_log" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "comment_user_idx" ON "comment" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "contract_uploader_idx" ON "contract" USING btree ("uploaded_by");
--> statement-breakpoint
CREATE INDEX "deliv_creator_idx" ON "deliverable" USING btree ("created_by");
--> statement-breakpoint
CREATE INDEX "files_uploader_idx" ON "files" USING btree ("uploaded_by");
--> statement-breakpoint
CREATE INDEX "invitation_org_idx" ON "invitation" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "invitation_inviter_idx" ON "invitation" USING btree ("inviter_id");
--> statement-breakpoint
CREATE INDEX "member_org_idx" ON "member" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "member_user_idx" ON "member" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "project_org_idx" ON "project" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "project_creator_idx" ON "project" USING btree ("created_by");
--> statement-breakpoint
CREATE INDEX "proj_invitation_project_idx" ON "project_invitation" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX "proj_invitation_inviter_idx" ON "project_invitation" USING btree ("invited_by");
--> statement-breakpoint
CREATE UNIQUE INDEX "pm_project_user_unique" ON "project_member" USING btree ("project_id","user_id");
--> statement-breakpoint
CREATE INDEX "proposal_project_idx" ON "proposal" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX "proposal_creator_idx" ON "proposal" USING btree ("created_by");
--> statement-breakpoint
CREATE INDEX "proposal_items_proposal_idx" ON "proposal_line_items" USING btree ("proposal_id");
--> statement-breakpoint
CREATE INDEX "signature_contract_idx" ON "signature" USING btree ("contract_id");
--> statement-breakpoint
CREATE INDEX "signature_user_idx" ON "signature" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "signature_contract_user_unique" ON "signature" USING btree ("contract_id","user_id");
--> statement-breakpoint
CREATE INDEX "team_org_idx" ON "team" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "tm_team_idx" ON "team_member" USING btree ("team_id");
--> statement-breakpoint
CREATE INDEX "tm_member_idx" ON "team_member" USING btree ("member_id");
--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN IF EXISTS "brand_color";
--> statement-breakpoint
ALTER TABLE "project" DROP COLUMN IF EXISTS "workspace_id";
