CREATE TABLE IF NOT EXISTS "affair_entries" (
  "id" serial PRIMARY KEY NOT NULL,
  "affair_date" date NOT NULL,
  "affair_time" varchar(50) NOT NULL,
  "subject" varchar(150) NOT NULL,
  "location" varchar(150) NOT NULL,
  "operation_person_id" varchar(13) NOT NULL,
  "remark" varchar(150),
  "rec_date" date NOT NULL,
  "officer_person_id" varchar(13) NOT NULL
);

CREATE INDEX IF NOT EXISTS "affair_entries_affair_date_idx" ON "affair_entries" ("affair_date");
CREATE INDEX IF NOT EXISTS "affair_entries_operation_person_id_idx" ON "affair_entries" ("operation_person_id");

CREATE TABLE IF NOT EXISTS "affair_permissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "p1" integer DEFAULT 0 NOT NULL,
  "officer_person_id" varchar(13),
  "rec_date" date
);
