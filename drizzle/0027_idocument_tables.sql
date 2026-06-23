CREATE TABLE IF NOT EXISTS "idocument_main" (
  "id" serial PRIMARY KEY NOT NULL,
  "workgroup" integer NOT NULL,
  "workgroup_txt" text NOT NULL,
  "book_year" integer NOT NULL,
  "book_number" integer NOT NULL,
  "book_no" varchar(50) NOT NULL,
  "book_date" date NOT NULL,
  "subject" text NOT NULL,
  "pre_doc_id" varchar(100) NOT NULL,
  "book_to" varchar(255) NOT NULL,
  "content1" text NOT NULL,
  "content2" text NOT NULL,
  "content3" text NOT NULL,
  "officer" varchar(20) NOT NULL,
  "officer_name" varchar(255) NOT NULL,
  "officer_position" varchar(255) NOT NULL,
  "book_status" integer NOT NULL,
  "book_type" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS "idocument_main_officer_idx" ON "idocument_main" ("officer");
CREATE INDEX IF NOT EXISTS "idocument_main_book_year_number_idx" ON "idocument_main" ("book_year", "book_number");
CREATE INDEX IF NOT EXISTS "idocument_main_book_status_idx" ON "idocument_main" ("book_status");

CREATE TABLE IF NOT EXISTS "idocument_sendto" (
  "id" serial PRIMARY KEY NOT NULL,
  "document_id" integer NOT NULL,
  "rec_id" varchar(50) NOT NULL,
  "rec_from" varchar(25) DEFAULT NULL,
  "person_id" varchar(20) NOT NULL,
  "send_time" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "open_time" timestamp DEFAULT NULL,
  "document_from" varchar(50) DEFAULT NULL,
  "status" integer DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS "idocument_sendto_person_status_idx" ON "idocument_sendto" ("person_id", "status");
CREATE INDEX IF NOT EXISTS "idocument_sendto_document_id_idx" ON "idocument_sendto" ("document_id");

CREATE TABLE IF NOT EXISTS "idocument_comment" (
  "id" serial PRIMARY KEY NOT NULL,
  "document_id" integer NOT NULL,
  "rec_id" varchar(100) NOT NULL,
  "person_comments_id" varchar(20) NOT NULL,
  "person_comments_name" varchar(255) NOT NULL,
  "person_comments_position" varchar(255) NOT NULL,
  "comments_select" varchar(100) DEFAULT NULL,
  "comments_txt" varchar(255) DEFAULT NULL,
  "comments_etctxt" varchar(255) DEFAULT NULL,
  "comments_date" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "comments_type" integer DEFAULT NULL,
  "comments_status" integer DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS "idocument_comment_document_id_idx" ON "idocument_comment" ("document_id");

CREATE TABLE IF NOT EXISTS "idocument_files" (
  "id" serial PRIMARY KEY NOT NULL,
  "document_id" integer DEFAULT NULL,
  "file_name" varchar(255) DEFAULT NULL,
  "file_des" varchar(255) DEFAULT NULL,
  "filetype" varchar(5) DEFAULT NULL,
  "docType" varchar(10) DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS "idocument_files_document_id_idx" ON "idocument_files" ("document_id");
