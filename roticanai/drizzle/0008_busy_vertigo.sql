CREATE TABLE "inspo" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"prompt" text NOT NULL,
	"thumbnail_url" text,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "inspo_category_idx" ON "inspo" USING btree ("category");--> statement-breakpoint
CREATE INDEX "inspo_featured_idx" ON "inspo" USING btree ("featured");