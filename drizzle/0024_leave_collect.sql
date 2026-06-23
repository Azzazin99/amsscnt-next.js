ALTER TABLE "leave_person_settings" ADD COLUMN IF NOT EXISTS "comment_person2_id" varchar(13);

CREATE TABLE IF NOT EXISTS "leave_collect" (
  "id" serial PRIMARY KEY NOT NULL,
  "budget_year" integer NOT NULL,
  "person_id" varchar(13) NOT NULL,
  "collect_day" real DEFAULT 0 NOT NULL,
  "this_year_day" smallint DEFAULT 0 NOT NULL,
  "officer_person_id" varchar(13),
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "leave_collect_budget_year_person_id_idx" ON "leave_collect" ("budget_year", "person_id");
