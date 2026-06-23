ALTER TABLE "la_years" RENAME TO "leave_years";
--> statement-breakpoint
ALTER TABLE "la_permissions" RENAME TO "leave_permissions";
--> statement-breakpoint
ALTER TABLE "la_person_settings" RENAME TO "leave_person_settings";
--> statement-breakpoint
ALTER TABLE "la_requests" RENAME TO "leave_requests";
--> statement-breakpoint
ALTER TABLE "leave_requests" RENAME COLUMN "la_type" TO "leave_type";
--> statement-breakpoint
ALTER TABLE "leave_requests" RENAME COLUMN "la_start" TO "leave_start";
--> statement-breakpoint
ALTER TABLE "leave_requests" RENAME COLUMN "la_finish" TO "leave_finish";
--> statement-breakpoint
ALTER TABLE "leave_requests" RENAME COLUMN "la_total" TO "leave_total";
--> statement-breakpoint
ALTER INDEX IF EXISTS "la_years_budget_year_idx" RENAME TO "leave_years_budget_year_idx";
--> statement-breakpoint
ALTER INDEX IF EXISTS "la_person_settings_person_id_idx" RENAME TO "leave_person_settings_person_id_idx";
--> statement-breakpoint
ALTER INDEX IF EXISTS "la_requests_person_id_idx" RENAME TO "leave_requests_person_id_idx";
--> statement-breakpoint
ALTER INDEX IF EXISTS "la_requests_school_id_idx" RENAME TO "leave_requests_school_id_idx";
--> statement-breakpoint
ALTER INDEX IF EXISTS "la_requests_la_start_idx" RENAME TO "leave_requests_leave_start_idx";
--> statement-breakpoint
ALTER TABLE "leave_years" RENAME CONSTRAINT "la_years_budget_year_unique" TO "leave_years_budget_year_unique";
--> statement-breakpoint
ALTER TABLE "leave_person_settings" RENAME CONSTRAINT "la_person_settings_person_id_unique" TO "leave_person_settings_person_id_unique";
--> statement-breakpoint
UPDATE "modules" SET "slug" = 'leave' WHERE "slug" = 'la';
--> statement-breakpoint
UPDATE "module_admins" SET "module_slug" = 'leave' WHERE "module_slug" = 'la';
