CREATE TABLE IF NOT EXISTS "cabinet_documents" (
  "id" serial PRIMARY KEY NOT NULL,
  "file_id" integer DEFAULT 1 NOT NULL,
  "tray_id" integer DEFAULT 1 NOT NULL,
  "cabinet_id" integer DEFAULT 1 NOT NULL,
  "cabinet_type" integer DEFAULT 1 NOT NULL,
  "doc_subject" varchar(150) NOT NULL,
  "doc_size" real NOT NULL,
  "doc_name" varchar(255) NOT NULL,
  "doc_type" varchar(10) NOT NULL,
  "status" integer DEFAULT 0 NOT NULL,
  "person_id" varchar(13) NOT NULL,
  "rec_date" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "cabinet_documents_person_id_idx" ON "cabinet_documents" ("person_id");
CREATE INDEX IF NOT EXISTS "cabinet_documents_rec_date_idx" ON "cabinet_documents" ("rec_date");
CREATE INDEX IF NOT EXISTS "cabinet_documents_doc_subject_idx" ON "cabinet_documents" ("doc_subject");

CREATE TABLE IF NOT EXISTS "cabinet_permissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "p1" integer DEFAULT 0 NOT NULL,
  "officer_person_id" varchar(13),
  "rec_date" date
);
