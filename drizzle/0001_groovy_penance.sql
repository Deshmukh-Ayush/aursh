CREATE TABLE "proposal" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"scope_summary" text,
	"price" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"valid_until" timestamp,
	"status" text DEFAULT 'draft' NOT NULL,
	"sent_at" timestamp,
	"accepted_at" timestamp,
	"declined_at" timestamp,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_line_items" (
	"id" text PRIMARY KEY NOT NULL,
	"proposal_id" text NOT NULL,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"total" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "contract" ADD COLUMN "signed_document_url" text;--> statement-breakpoint
ALTER TABLE "contract" ADD COLUMN "document_hash" text;--> statement-breakpoint
ALTER TABLE "deliverable" ADD COLUMN "submission_title" text;--> statement-breakpoint
ALTER TABLE "deliverable" ADD COLUMN "submission_url" text;--> statement-breakpoint
ALTER TABLE "deliverable" ADD COLUMN "submission_note" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "workspace_id" text;--> statement-breakpoint
ALTER TABLE "signature" ADD COLUMN "signature_data" text;--> statement-breakpoint
ALTER TABLE "signature" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "signature" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "signature" ADD COLUMN "document_hash" text;--> statement-breakpoint
ALTER TABLE "signature" ADD COLUMN "signature_method" text;--> statement-breakpoint
ALTER TABLE "signature" ADD COLUMN "audit_trail" jsonb;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_line_items" ADD CONSTRAINT "proposal_line_items_proposal_id_proposal_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_project_idx" ON "activity_log" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "comment_project_idx" ON "comment" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "comment_deliv_idx" ON "comment" USING btree ("deliverable_id");--> statement-breakpoint
CREATE INDEX "contract_project_idx" ON "contract" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "deliv_project_idx" ON "deliverable" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "files_project_idx" ON "files" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "notif_user_idx" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notif_project_idx" ON "notification" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "pm_project_idx" ON "project_member" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "pm_user_idx" ON "project_member" USING btree ("user_id");