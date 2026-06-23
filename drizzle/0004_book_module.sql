CREATE TABLE IF NOT EXISTS "book_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_id" integer,
	"name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "book_group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"school_id" integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "book_group_members_unique" ON "book_group_members" ("group_id","school_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "book_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_id" varchar(64) NOT NULL,
	"book_type" integer NOT NULL,
	"sender_person_id" varchar(13) NOT NULL,
	"office_code" varchar(13) NOT NULL,
	"sender_school_id" integer,
	"sender_workgroup_id" integer,
	"sender_user_id" integer,
	"urgency_level" integer DEFAULT 1 NOT NULL,
	"secret_level" integer DEFAULT 0 NOT NULL,
	"book_no" varchar(100) NOT NULL,
	"sign_date" date NOT NULL,
	"subject" varchar(500) NOT NULL,
	"detail" text,
	"send_date" timestamp DEFAULT now() NOT NULL,
	"book_regis_link" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "book_documents_ref_id_idx" ON "book_documents" ("ref_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "book_documents_book_type_idx" ON "book_documents" ("book_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "book_documents_sender_school_idx" ON "book_documents" ("sender_school_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "book_recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_id" varchar(64) NOT NULL,
	"send_level" integer,
	"send_to" varchar(32) NOT NULL,
	"school_scope" varchar(32),
	"status" integer,
	"answered" boolean DEFAULT false NOT NULL,
	"answered_at" timestamp,
	"forward_from" varchar(32),
	"forward_received_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "book_recipients_ref_id_idx" ON "book_recipients" ("ref_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "book_recipients_send_to_idx" ON "book_recipients" ("send_to");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "book_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_id" varchar(64) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_des" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "book_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"p1" integer DEFAULT 0 NOT NULL,
	"p2" integer DEFAULT 0 NOT NULL,
	"p3" integer DEFAULT 0 NOT NULL,
	"can_view_secret" boolean DEFAULT false NOT NULL,
	CONSTRAINT "book_permissions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "book_group_members" ADD CONSTRAINT "book_group_members_group_id_book_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."book_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "book_group_members" ADD CONSTRAINT "book_group_members_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "book_documents" ADD CONSTRAINT "book_documents_sender_school_id_schools_id_fk" FOREIGN KEY ("sender_school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "book_documents" ADD CONSTRAINT "book_documents_sender_workgroup_id_workgroups_id_fk" FOREIGN KEY ("sender_workgroup_id") REFERENCES "public"."workgroups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "book_documents" ADD CONSTRAINT "book_documents_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "book_permissions" ADD CONSTRAINT "book_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
