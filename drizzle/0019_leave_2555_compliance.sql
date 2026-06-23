ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "service_start_date" date;
--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "half_day_period" varchar(10);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leave_quota_balances" (
  "id" serial PRIMARY KEY NOT NULL,
  "person_id" varchar(13) NOT NULL,
  "budget_year" integer NOT NULL,
  "leave_type" integer NOT NULL,
  "entitled" real NOT NULL DEFAULT 0,
  "used" real NOT NULL DEFAULT 0,
  "carried" real NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "leave_quota_balances_person_year_type_idx" ON "leave_quota_balances" ("person_id", "budget_year", "leave_type");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leave_request_files" (
  "id" serial PRIMARY KEY NOT NULL,
  "request_id" integer NOT NULL REFERENCES "leave_requests"("id") ON DELETE CASCADE,
  "file_name" varchar(255) NOT NULL,
  "file_des" varchar(255),
  "file_size" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leave_request_files_request_id_idx" ON "leave_request_files" ("request_id");
