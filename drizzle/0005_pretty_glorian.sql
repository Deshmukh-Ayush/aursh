ALTER TABLE "organization" ADD COLUMN "global_currency" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "fx_rate_at_payment" numeric(10, 4);--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "currency" text DEFAULT 'USD' NOT NULL;