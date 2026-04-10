ALTER TABLE "app" ADD COLUMN "slug" text;--> statement-breakpoint
CREATE INDEX "app_slug_idx" ON "app" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "app" ADD CONSTRAINT "app_slug_unique" UNIQUE("slug");