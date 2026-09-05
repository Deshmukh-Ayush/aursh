ALTER TABLE "payment" ALTER COLUMN "milestone_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_proof" ALTER COLUMN "milestone_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "invoice_id" text;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pay_invoice_idx" ON "payment" USING btree ("invoice_id");