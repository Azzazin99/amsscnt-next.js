CREATE TABLE IF NOT EXISTS "achievement_permissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "p1" integer DEFAULT 0 NOT NULL,
  "p2" integer DEFAULT 0 NOT NULL,
  "p3" integer DEFAULT 0 NOT NULL,
  "officer_person_id" varchar(13)
);

CREATE TABLE IF NOT EXISTS "achievement_scores" (
  "id" serial PRIMARY KEY NOT NULL,
  "test_type" integer NOT NULL,
  "test_class" integer NOT NULL,
  "ed_year" integer NOT NULL,
  "school_code" varchar(12) NOT NULL,
  "thai" real DEFAULT 0 NOT NULL,
  "math" real DEFAULT 0 NOT NULL,
  "science" real DEFAULT 0 NOT NULL,
  "social" real DEFAULT 0 NOT NULL,
  "english" real DEFAULT 0 NOT NULL,
  "health" real DEFAULT 0 NOT NULL,
  "art" real DEFAULT 0 NOT NULL,
  "vocation" real DEFAULT 0 NOT NULL,
  "score_avg" real DEFAULT 0 NOT NULL,
  "officer_person_id" varchar(13),
  "rec_date" date
);

CREATE INDEX IF NOT EXISTS "achievement_scores_ed_year_idx" ON "achievement_scores" ("ed_year");
CREATE INDEX IF NOT EXISTS "achievement_scores_school_code_idx" ON "achievement_scores" ("school_code");
CREATE UNIQUE INDEX IF NOT EXISTS "achievement_scores_unique_idx" ON "achievement_scores" ("test_type", "test_class", "ed_year", "school_code");

CREATE TABLE IF NOT EXISTS "student_ed_years" (
  "id" serial PRIMARY KEY NOT NULL,
  "ed_year" integer NOT NULL,
  "year_active" boolean DEFAULT false NOT NULL,
  CONSTRAINT "student_ed_years_ed_year_unique" UNIQUE("ed_year")
);

CREATE TABLE IF NOT EXISTS "student_permissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "school_id" integer REFERENCES "schools"("id"),
  "p1" integer DEFAULT 0 NOT NULL,
  "p2" integer DEFAULT 0 NOT NULL,
  "officer_person_id" varchar(13)
);

CREATE UNIQUE INDEX IF NOT EXISTS "student_permissions_user_school_idx" ON "student_permissions" ("user_id", "school_id");

CREATE TABLE IF NOT EXISTS "students" (
  "id" serial PRIMARY KEY NOT NULL,
  "ed_year" integer NOT NULL,
  "ref_id" varchar(20) NOT NULL,
  "school_code" varchar(15) NOT NULL,
  "student_id" varchar(15) NOT NULL,
  "person_id" varchar(13) NOT NULL,
  "prename" varchar(20) NOT NULL,
  "name" varchar(50) NOT NULL,
  "surname" varchar(50) NOT NULL,
  "sex" varchar(5) NOT NULL,
  "school_name" varchar(150) NOT NULL,
  "class_level" integer NOT NULL,
  "classroom" integer DEFAULT 1 NOT NULL,
  "disable" integer DEFAULT 0 NOT NULL,
  "status" integer DEFAULT 0 NOT NULL,
  "rec_date" date NOT NULL,
  "officer_person_id" varchar(13) NOT NULL
);

CREATE INDEX IF NOT EXISTS "students_ed_year_idx" ON "students" ("ed_year");
CREATE INDEX IF NOT EXISTS "students_school_code_idx" ON "students" ("school_code");
CREATE INDEX IF NOT EXISTS "students_person_id_idx" ON "students" ("person_id");
CREATE UNIQUE INDEX IF NOT EXISTS "students_ed_year_school_student_idx" ON "students" ("ed_year", "school_code", "student_id");

CREATE TABLE IF NOT EXISTS "spacial_student_permissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "school_id" integer REFERENCES "schools"("id"),
  "p1" integer DEFAULT 0 NOT NULL,
  "p2" integer DEFAULT 0 NOT NULL,
  "p3" integer DEFAULT 0 NOT NULL,
  "class_level" varchar(2),
  "officer_person_id" varchar(13)
);

CREATE UNIQUE INDEX IF NOT EXISTS "spacial_student_permissions_user_school_idx" ON "spacial_student_permissions" ("user_id", "school_id");

CREATE TABLE IF NOT EXISTS "spacial_student_disabled" (
  "id" serial PRIMARY KEY NOT NULL,
  "person_id" varchar(13) NOT NULL,
  "school_code" varchar(15) NOT NULL,
  "disable_type" integer DEFAULT 0 NOT NULL,
  "disable_detail" text DEFAULT '' NOT NULL,
  "other" text DEFAULT '' NOT NULL,
  "pic" varchar(150) DEFAULT '' NOT NULL,
  "status" integer DEFAULT 0 NOT NULL,
  "officer_person_id" varchar(13) NOT NULL,
  "rec_date" date NOT NULL
);

CREATE INDEX IF NOT EXISTS "spacial_student_disabled_school_code_idx" ON "spacial_student_disabled" ("school_code");
CREATE INDEX IF NOT EXISTS "spacial_student_disabled_person_id_idx" ON "spacial_student_disabled" ("person_id");
CREATE UNIQUE INDEX IF NOT EXISTS "spacial_student_disabled_person_school_idx" ON "spacial_student_disabled" ("person_id", "school_code");
