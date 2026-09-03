CREATE TABLE "payment_proof" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text,
	"milestone_id" text NOT NULL,
	"project_id" text NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"extracted_data" jsonb,
	"status" text DEFAULT 'pending_review' NOT NULL,
	"rejection_reason" text,
	"submitted_by" text NOT NULL,
	"reviewed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "payment_proof" ADD CONSTRAINT "payment_proof_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_proof" ADD CONSTRAINT "payment_proof_milestone_id_payment_milestone_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."payment_milestone"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_proof" ADD CONSTRAINT "payment_proof_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_proof" ADD CONSTRAINT "payment_proof_submitted_by_user_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_proof" ADD CONSTRAINT "payment_proof_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_proof_invoice_idx" ON "payment_proof" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payment_proof_milestone_idx" ON "payment_proof" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "payment_proof_status_idx" ON "payment_proof" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_proof_project_idx" ON "payment_proof" USING btree ("project_id");