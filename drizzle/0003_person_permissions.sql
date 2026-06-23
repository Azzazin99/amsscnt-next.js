CREATE TABLE IF NOT EXISTS "person_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"p1" integer DEFAULT 0 NOT NULL,
	"p2" integer DEFAULT 0 NOT NULL,
	"p3" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "person_permissions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "person_permissions" ADD CONSTRAINT "person_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
