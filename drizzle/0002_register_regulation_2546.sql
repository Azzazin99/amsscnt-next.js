ALTER TABLE "register_receives" ADD COLUMN IF NOT EXISTS "urgency_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "register_receives" ADD COLUMN IF NOT EXISTS "secret_level" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "register_sends" ADD COLUMN IF NOT EXISTS "urgency_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "register_sends" ADD COLUMN IF NOT EXISTS "secret_level" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "register_commands" ADD COLUMN IF NOT EXISTS "urgency_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "register_commands" ADD COLUMN IF NOT EXISTS "secret_level" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "register_certificates" ADD COLUMN IF NOT EXISTS "urgency_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "register_certificates" ADD COLUMN IF NOT EXISTS "secret_level" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "register_permissions" ADD COLUMN IF NOT EXISTS "can_view_secret" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "register_receives" SET "secret_level" = 1 WHERE "secret" = true AND "secret_level" = 0;--> statement-breakpoint
UPDATE "register_sends" SET "secret_level" = 1 WHERE "secret" = true AND "secret_level" = 0;
