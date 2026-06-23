CREATE TABLE IF NOT EXISTS "book_retention_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_type" integer NOT NULL,
	"retention_years" integer DEFAULT 2 NOT NULL,
	CONSTRAINT "book_retention_settings_book_type_unique" UNIQUE("book_type")
);
--> statement-breakpoint
INSERT INTO "book_retention_settings" ("book_type", "retention_years")
VALUES (1, 2), (2, 2), (3, 2), (6, 2)
ON CONFLICT ("book_type") DO NOTHING;
