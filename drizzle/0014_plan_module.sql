CREATE TABLE IF NOT EXISTS "plan_years" (
  "id" serial PRIMARY KEY NOT NULL,
  "budget_year" integer NOT NULL,
  "year_active" boolean DEFAULT false NOT NULL,
  CONSTRAINT "plan_years_budget_year_unique" UNIQUE("budget_year")
);

CREATE TABLE IF NOT EXISTS "plan_projects" (
  "id" serial PRIMARY KEY NOT NULL,
  "budget_year" integer NOT NULL,
  "code_clus" integer NOT NULL,
  "code_tegy" varchar(1) DEFAULT '1' NOT NULL,
  "code_proj" varchar(3) NOT NULL,
  "budget_proj" real DEFAULT 0 NOT NULL,
  "name_proj" varchar(100) NOT NULL,
  "owner_proj" varchar(13) DEFAULT '' NOT NULL,
  "begin_date" date NOT NULL,
  "finish_date" date NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "plan_projects_year_code_idx" ON "plan_projects" ("budget_year", "code_proj");
CREATE INDEX IF NOT EXISTS "plan_projects_budget_year_idx" ON "plan_projects" ("budget_year");
CREATE INDEX IF NOT EXISTS "plan_projects_code_clus_idx" ON "plan_projects" ("code_clus");

CREATE TABLE IF NOT EXISTS "plan_activities" (
  "id" serial PRIMARY KEY NOT NULL,
  "budget_year" integer NOT NULL,
  "code_clus" integer NOT NULL,
  "code_proj" varchar(3) NOT NULL,
  "code_acti" varchar(6) NOT NULL,
  "code_approve" varchar(6) DEFAULT '' NOT NULL,
  "budget_acti" real DEFAULT 0 NOT NULL,
  "name_acti" varchar(100) NOT NULL,
  "owner_acti" varchar(13) DEFAULT '' NOT NULL,
  "begin_date" date NOT NULL,
  "finish_date" date NOT NULL,
  "stop" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "plan_activities_year_code_idx" ON "plan_activities" ("budget_year", "code_acti");
CREATE INDEX IF NOT EXISTS "plan_activities_proj_idx" ON "plan_activities" ("budget_year", "code_proj");
