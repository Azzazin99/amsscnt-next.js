CREATE TABLE IF NOT EXISTS "mail_groups" (
  "id" serial PRIMARY KEY NOT NULL,
  "legacy_id" integer,
  "name" varchar(255) NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "mail_group_members" (
  "id" serial PRIMARY KEY NOT NULL,
  "group_id" integer NOT NULL REFERENCES "mail_groups"("id") ON DELETE CASCADE,
  "person_id" varchar(13) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "mail_group_members_unique" ON "mail_group_members" ("group_id","person_id");
CREATE INDEX IF NOT EXISTS "mail_group_members_person_id_idx" ON "mail_group_members" ("person_id");

CREATE TABLE IF NOT EXISTS "mail_documents" (
  "id" serial PRIMARY KEY NOT NULL,
  "ref_id" varchar(64) NOT NULL,
  "sender_person_id" varchar(13) NOT NULL,
  "sender_user_id" integer REFERENCES "users"("id"),
  "subject" varchar(150) NOT NULL,
  "detail" text,
  "send_date" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "mail_documents_ref_id_idx" ON "mail_documents" ("ref_id");
CREATE INDEX IF NOT EXISTS "mail_documents_sender_person_id_idx" ON "mail_documents" ("sender_person_id");
CREATE INDEX IF NOT EXISTS "mail_documents_send_date_idx" ON "mail_documents" ("send_date");

CREATE TABLE IF NOT EXISTS "mail_recipients" (
  "id" serial PRIMARY KEY NOT NULL,
  "ref_id" varchar(64) NOT NULL,
  "send_to" varchar(13) NOT NULL,
  "answered" boolean DEFAULT false NOT NULL,
  "answered_at" timestamp
);

CREATE INDEX IF NOT EXISTS "mail_recipients_ref_id_idx" ON "mail_recipients" ("ref_id");
CREATE INDEX IF NOT EXISTS "mail_recipients_send_to_idx" ON "mail_recipients" ("send_to");

CREATE TABLE IF NOT EXISTS "mail_files" (
  "id" serial PRIMARY KEY NOT NULL,
  "ref_id" varchar(64) NOT NULL,
  "file_name" varchar(255) NOT NULL,
  "file_des" varchar(255)
);

CREATE TABLE IF NOT EXISTS "mail_permissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "p1" integer DEFAULT 0 NOT NULL,
  "officer_person_id" varchar(13),
  "rec_date" date
);
