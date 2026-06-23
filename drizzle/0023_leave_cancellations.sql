CREATE TABLE IF NOT EXISTS "leave_cancellations" (
  "id" serial PRIMARY KEY,
  "person_id" varchar(13) NOT NULL,
  "source_request_id" integer NOT NULL REFERENCES "leave_requests"("id") ON DELETE CASCADE,
  "leave_type" integer NOT NULL,
  "write_at" varchar(100),
  "permission_start" date NOT NULL,
  "permission_finish" date NOT NULL,
  "permission_total" real NOT NULL,
  "because" varchar(200) NOT NULL,
  "cancel_start" date NOT NULL,
  "cancel_finish" date NOT NULL,
  "cancel_total" real NOT NULL,
  "no_comment" boolean NOT NULL DEFAULT false,
  "grant_person_selected" varchar(13),
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
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "leave_cancellations_source_request_id_idx"
  ON "leave_cancellations" ("source_request_id");

CREATE INDEX IF NOT EXISTS "leave_cancellations_person_id_idx"
  ON "leave_cancellations" ("person_id");

CREATE INDEX IF NOT EXISTS "leave_cancellations_cancel_start_idx"
  ON "leave_cancellations" ("cancel_start");
