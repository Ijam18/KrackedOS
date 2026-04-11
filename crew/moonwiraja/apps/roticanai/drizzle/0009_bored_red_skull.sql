CREATE TABLE "app_like" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "is_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "like_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "remix_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "remixed_from_id" text;--> statement-breakpoint
ALTER TABLE "app_like" ADD CONSTRAINT "app_like_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_like" ADD CONSTRAINT "app_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "app_like_app_user_idx" ON "app_like" USING btree ("app_id","user_id");--> statement-breakpoint
CREATE INDEX "app_like_user_id_idx" ON "app_like" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "app_published_at_idx" ON "app" USING btree ("is_published","published_at");--> statement-breakpoint
CREATE INDEX "app_published_likes_idx" ON "app" USING btree ("is_published","like_count");--> statement-breakpoint
CREATE INDEX "app_remixed_from_id_idx" ON "app" USING btree ("remixed_from_id");