ALTER TABLE "app" ADD COLUMN "github_repo_id" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "github_repo_owner" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "github_repo_name" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "github_repo_url" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "github_default_branch" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "github_linked_at" timestamp;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "github_last_pushed_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bio" text;--> statement-breakpoint
CREATE INDEX "app_github_repo_id_idx" ON "app" USING btree ("github_repo_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_idx" ON "user" USING btree ("username");