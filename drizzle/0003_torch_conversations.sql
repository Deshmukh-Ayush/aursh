CREATE TABLE "torch_conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "torch_message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"reasoning_steps" jsonb,
	"artifact" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "torch_conversation" ADD CONSTRAINT "torch_conversation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "torch_conversation" ADD CONSTRAINT "torch_conversation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "torch_message" ADD CONSTRAINT "torch_message_conversation_id_torch_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."torch_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "torch_conv_org_idx" ON "torch_conversation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "torch_conv_user_idx" ON "torch_conversation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "torch_conv_updated_idx" ON "torch_conversation" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "torch_msg_conv_idx" ON "torch_message" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "torch_msg_created_idx" ON "torch_message" USING btree ("created_at");