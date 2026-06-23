CREATE TABLE IF NOT EXISTS "budget_years" (
  "id" serial PRIMARY KEY NOT NULL,
  "budget_year" integer NOT NULL,
  "year_active" boolean DEFAULT false NOT NULL,
  CONSTRAINT "budget_years_budget_year_unique" UNIQUE("budget_year")
);

CREATE TABLE IF NOT EXISTS "budget_permissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "person_id" varchar(13) NOT NULL,
  "p1" integer DEFAULT 0 NOT NULL,
  "p2" integer DEFAULT 0 NOT NULL,
  "p3" integer DEFAULT 0 NOT NULL,
  "p4" integer DEFAULT 0 NOT NULL,
  "p5" integer DEFAULT 0 NOT NULL,
  "p6" integer DEFAULT 0 NOT NULL,
  "p7" integer DEFAULT 0 NOT NULL,
  "p8" integer DEFAULT 0 NOT NULL,
  "p9" integer DEFAULT 0 NOT NULL,
  "p10" integer DEFAULT 0 NOT NULL,
  "officer" varchar(13) NOT NULL,
  "rec_date" date NOT NULL,
  CONSTRAINT "budget_permissions_person_id_unique" UNIQUE("person_id")
);

CREATE TABLE IF NOT EXISTS "budget_pay_types" (
  "id" serial PRIMARY KEY NOT NULL,
  "pay_type_id" integer NOT NULL,
  "pay_group_id" integer NOT NULL,
  "pay_type_name" varchar(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS "budget_main" (
  "id" serial PRIMARY KEY NOT NULL,
  "budget_year" integer NOT NULL,
  "doc" varchar(30) NOT NULL,
  "refer_wd_id" integer,
  "refer_deega_id" integer,
  "type_id" integer NOT NULL,
  "item" varchar(100) NOT NULL,
  "receive_amount" real,
  "pay_amount" real,
  "payed_person" varchar(50),
  "change_amount" real,
  "pay_group" integer,
  "status" integer,
  "rec_date" date NOT NULL,
  "officer" varchar(13),
  "approve_date" date,
  "approve" integer,
  "approve_name" varchar(13),
  "pay_date" date,
  "check_number" varchar(30),
  "payee" varchar(50),
  "payer" varchar(13),
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "budget_main_budget_year_idx" ON "budget_main" ("budget_year");
CREATE INDEX IF NOT EXISTS "budget_main_type_id_idx" ON "budget_main" ("type_id");
CREATE INDEX IF NOT EXISTS "budget_main_rec_date_idx" ON "budget_main" ("rec_date");
