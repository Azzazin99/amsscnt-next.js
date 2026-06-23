--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leave_requests_person_type_grant_idx" ON "leave_requests" USING btree ("person_id","leave_type","commander_grant");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leave_requests_date_range_idx" ON "leave_requests" USING btree ("leave_start","leave_finish");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leave_requests_school_grant_idx" ON "leave_requests" USING btree ("school_id","commander_grant");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leave_requests_job_person_unsigned_idx" ON "leave_requests" USING btree ("job_person_id") WHERE "job_person_signed" = false;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leave_person_settings_comment_person_idx" ON "leave_person_settings" USING btree ("comment_person_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leave_person_settings_comment_person2_idx" ON "leave_person_settings" USING btree ("comment_person2_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leave_person_settings_grant_person_idx" ON "leave_person_settings" USING btree ("grant_person_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leave_cancellations_person_type_grant_idx" ON "leave_cancellations" USING btree ("person_id","leave_type","commander_grant");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leave_cancellations_date_range_idx" ON "leave_cancellations" USING btree ("cancel_start","cancel_finish");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leave_years_active_idx" ON "leave_years" USING btree ("year_active") WHERE "year_active" = true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "people_org_status_idx" ON "people" USING btree ("organization_type","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "people_school_status_idx" ON "people" USING btree ("school_id","status") WHERE "school_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "register_receives_report_idx" ON "register_receives" USING btree ("year","school_id","register_number") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "register_sends_report_idx" ON "register_sends" USING btree ("year","school_id","register_number") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "register_commands_report_idx" ON "register_commands" USING btree ("year","register_number") WHERE "school_id" IS NULL AND "deleted_at" IS NULL;
