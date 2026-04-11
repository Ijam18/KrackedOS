CREATE TABLE "app" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"sandbox_id" text,
	"total_input_tokens" integer DEFAULT 0 NOT NULL,
	"total_output_tokens" integer DEFAULT 0 NOT NULL,
	"total_cost" numeric(10, 6) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"role" text NOT NULL,
	"parts" jsonb NOT NULL,
	"metadata" jsonb,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"model_id" text,
	"duration_ms" integer,
	"finish_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app" ADD CONSTRAINT "app_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_user_id_created_at_idx" ON "app" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "app_user_id_status_idx" ON "app" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "message_app_id_created_at_idx" ON "message" USING btree ("app_id","created_at");