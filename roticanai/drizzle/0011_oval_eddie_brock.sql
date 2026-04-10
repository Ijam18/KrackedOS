CREATE TABLE "guest_daily_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"quota_key" text NOT NULL,
	"date" text NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guest_daily_usage_quota_date_unique" UNIQUE("quota_key","date")
);
--> statement-breakpoint
CREATE INDEX "guest_daily_usage_quota_key_idx" ON "guest_daily_usage" USING btree ("quota_key");