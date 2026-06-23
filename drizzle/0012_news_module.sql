CREATE TABLE IF NOT EXISTS "news_mainitems" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" integer NOT NULL,
  "mainitem" varchar(150) NOT NULL,
  "item_active" boolean DEFAULT false NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "news_mainitems_code_idx" ON "news_mainitems" ("code");

CREATE TABLE IF NOT EXISTS "news_sections" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" integer NOT NULL,
  "name" varchar(100) NOT NULL,
  "mainitem_code" integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "news_sections_mainitem_code_idx" ON "news_sections" ("mainitem_code","code");

CREATE TABLE IF NOT EXISTS "news_articles" (
  "id" serial PRIMARY KEY NOT NULL,
  "report_date" timestamp DEFAULT now() NOT NULL,
  "news" varchar(250) NOT NULL,
  "file" varchar(255),
  "section_code" integer NOT NULL,
  "mainitem_code" integer NOT NULL,
  "officer_person_id" varchar(13) NOT NULL
);

CREATE INDEX IF NOT EXISTS "news_articles_mainitem_code_idx" ON "news_articles" ("mainitem_code");
CREATE INDEX IF NOT EXISTS "news_articles_section_code_idx" ON "news_articles" ("section_code");
CREATE INDEX IF NOT EXISTS "news_articles_report_date_idx" ON "news_articles" ("report_date");

CREATE TABLE IF NOT EXISTS "news_permissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "p1" integer DEFAULT 0 NOT NULL,
  "officer_person_id" varchar(13),
  "rec_date" date
);
