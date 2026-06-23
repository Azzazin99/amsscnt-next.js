CREATE TABLE IF NOT EXISTS "la_years" (
  "id" serial PRIMARY KEY NOT NULL,
  "budget_year" integer NOT NULL,
  "year_active" boolean DEFAULT false NOT NULL,
  CONSTRAINT "la_years_budget_year_unique" UNIQUE("budget_year")
);

CREATE TABLE IF NOT EXISTS "la_permissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "p1" integer DEFAULT 0 NOT NULL,
  "p2" integer DEFAULT 0 NOT NULL,
  "officer_person_id" varchar(13)
);

CREATE TABLE IF NOT EXISTS "la_person_settings" (
  "id" serial PRIMARY KEY NOT NULL,
  "person_id" varchar(13) NOT NULL,
  "comment_person_id" varchar(13),
  "grant_person_id" varchar(13),
  "officer_person_id" varchar(13),
  CONSTRAINT "la_person_settings_person_id_unique" UNIQUE("person_id")
);

CREATE TABLE IF NOT EXISTS "la_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "person_id" varchar(13) NOT NULL,
  "school_id" integer REFERENCES "schools"("id"),
  "la_type" integer NOT NULL,
  "write_at" varchar(100),
  "because" varchar(250),
  "la_start" date NOT NULL,
  "la_finish" date NOT NULL,
  "la_total" real NOT NULL,
  "contact" varchar(150),
  "contact_tel" varchar(20),
  "document_name" varchar(100),
  "no_comment" boolean DEFAULT false NOT NULL,
  "grant_person_selected" varchar(13),
  "job_person_id" varchar(13),
  "job_person_signed" boolean DEFAULT false NOT NULL,
  "officer_comment" varchar(200),
  "officer_sign_person_id" varchar(13),
  "officer_date" timestamp,
  "group_comment" varchar(100),
  "group_sign_person_id" varchar(13),
  "group_date" timestamp,
  "commander_grant" integer,
  "commander_comment" varchar(100),
  "commander_sign_person_id" varchar(13),
  "grant_date" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "la_requests_person_id_idx" ON "la_requests" ("person_id");
CREATE INDEX IF NOT EXISTS "la_requests_school_id_idx" ON "la_requests" ("school_id");
CREATE INDEX IF NOT EXISTS "la_requests_la_start_idx" ON "la_requests" ("la_start");
