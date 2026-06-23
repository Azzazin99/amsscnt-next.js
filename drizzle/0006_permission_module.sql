CREATE TABLE IF NOT EXISTS "permission_years" (
  "id" serial PRIMARY KEY NOT NULL,
  "budget_year" integer NOT NULL,
  "year_active" boolean DEFAULT false NOT NULL,
  CONSTRAINT "permission_years_budget_year_unique" UNIQUE("budget_year")
);

CREATE TABLE IF NOT EXISTS "permission_permissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "p1" integer DEFAULT 0 NOT NULL,
  "p2" integer DEFAULT 0 NOT NULL,
  "officer_person_id" varchar(13)
);

CREATE TABLE IF NOT EXISTS "permission_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "person_id" varchar(13) NOT NULL,
  "ref_id" varchar(50) NOT NULL,
  "school_id" integer REFERENCES "schools"("id"),
  "subject" varchar(150) NOT NULL,
  "place" varchar(150) NOT NULL,
  "travel_start" date NOT NULL,
  "travel_finish" date NOT NULL,
  "vehicle" varchar(150),
  "document" varchar(150),
  "grant_status" integer,
  "grant_comment" varchar(200),
  "grant_person_id" varchar(13),
  "grant_date" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "permission_requests_ref_id_unique" UNIQUE("ref_id")
);

CREATE INDEX IF NOT EXISTS "permission_requests_person_id_idx" ON "permission_requests" ("person_id");
CREATE INDEX IF NOT EXISTS "permission_requests_school_id_idx" ON "permission_requests" ("school_id");
CREATE INDEX IF NOT EXISTS "permission_requests_travel_start_idx" ON "permission_requests" ("travel_start");
