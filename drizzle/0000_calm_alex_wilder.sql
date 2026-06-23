CREATE TYPE "public"."organization_type" AS ENUM('district', 'school');--> statement-breakpoint
CREATE TABLE "district_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"office_name" varchar(255) NOT NULL,
	"office_code" varchar(10) DEFAULT '1701' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_id" integer,
	"name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"module_slug" varchar(64) NOT NULL,
	"assigned_at" date,
	"assigned_by" integer
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"menu_group_id" integer,
	"where_work" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "modules_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" varchar(13) NOT NULL,
	"prefix" varchar(50),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"workgroup_id" integer,
	"school_id" integer,
	"organization_type" "organization_type" DEFAULT 'district' NOT NULL,
	"position_code" integer,
	"status" integer DEFAULT 0 NOT NULL,
	"multi_school" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "person_school_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" varchar(13) NOT NULL,
	"school_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "register_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer,
	"year" integer NOT NULL,
	"register_number" integer NOT NULL,
	"book_no" varchar(100),
	"signdate" date,
	"subject" text,
	"comment" text,
	"register_date" date,
	"ref_id" varchar(64) NOT NULL,
	"officer_id" integer,
	"secret" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"file_name" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "register_commands" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer,
	"year" integer NOT NULL,
	"register_number" integer NOT NULL,
	"book_no" varchar(100),
	"signdate" date,
	"subject" text,
	"comment" text,
	"register_date" date,
	"ref_id" varchar(64) NOT NULL,
	"officer_id" integer,
	"secret" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "register_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"p1" integer DEFAULT 0 NOT NULL,
	"p2" integer DEFAULT 0 NOT NULL,
	"p3" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "register_permissions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "register_receive_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_id" varchar(64) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_des" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "register_receives" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer,
	"year" integer NOT NULL,
	"register_number" integer NOT NULL,
	"book_no" varchar(100),
	"signdate" date,
	"subject" text,
	"comment" text,
	"register_date" date,
	"ref_id" varchar(64) NOT NULL,
	"officer_id" integer,
	"secret" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"book_from" text,
	"book_to" text,
	"operation" varchar(255),
	"workgroup_id" integer,
	"record_type" integer DEFAULT 1 NOT NULL,
	"book_link" integer DEFAULT 0 NOT NULL,
	"source" varchar(32) DEFAULT 'external' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "register_send_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_id" varchar(64) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_des" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "register_sends" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer,
	"year" integer NOT NULL,
	"register_number" integer NOT NULL,
	"book_no" varchar(100),
	"signdate" date,
	"subject" text,
	"comment" text,
	"register_date" date,
	"ref_id" varchar(64) NOT NULL,
	"officer_id" integer,
	"secret" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"book_from" text,
	"book_to" text,
	"operation" varchar(255),
	"workgroup_id" integer,
	"office_type" integer DEFAULT 1 NOT NULL,
	"forwarded_to_schools" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "register_years" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"school_id" integer,
	"year_active" boolean DEFAULT false NOT NULL,
	"start_receive_num" integer DEFAULT 1 NOT NULL,
	"start_send_num" integer DEFAULT 1 NOT NULL,
	"start_command_num" integer DEFAULT 1 NOT NULL,
	"start_certificate_num" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_id" integer,
	"name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_code" varchar(12) NOT NULL,
	"name" varchar(255) NOT NULL,
	"school_type" integer DEFAULT 0 NOT NULL,
	"school_group_id" integer,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"person_id" varchar(13) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"organization_type" "organization_type" DEFAULT 'district' NOT NULL,
	"school_id" integer,
	"is_super_admin" boolean DEFAULT false NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"status" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workgroups" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_code" integer,
	"name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "module_admins" ADD CONSTRAINT "module_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_admins" ADD CONSTRAINT "module_admins_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_menu_group_id_menu_groups_id_fk" FOREIGN KEY ("menu_group_id") REFERENCES "public"."menu_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_workgroup_id_workgroups_id_fk" FOREIGN KEY ("workgroup_id") REFERENCES "public"."workgroups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_school_assignments" ADD CONSTRAINT "person_school_assignments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "register_certificates" ADD CONSTRAINT "register_certificates_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "register_certificates" ADD CONSTRAINT "register_certificates_officer_id_users_id_fk" FOREIGN KEY ("officer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "register_commands" ADD CONSTRAINT "register_commands_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "register_commands" ADD CONSTRAINT "register_commands_officer_id_users_id_fk" FOREIGN KEY ("officer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "register_permissions" ADD CONSTRAINT "register_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "register_receives" ADD CONSTRAINT "register_receives_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "register_receives" ADD CONSTRAINT "register_receives_officer_id_users_id_fk" FOREIGN KEY ("officer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "register_receives" ADD CONSTRAINT "register_receives_workgroup_id_workgroups_id_fk" FOREIGN KEY ("workgroup_id") REFERENCES "public"."workgroups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "register_sends" ADD CONSTRAINT "register_sends_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "register_sends" ADD CONSTRAINT "register_sends_officer_id_users_id_fk" FOREIGN KEY ("officer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "register_sends" ADD CONSTRAINT "register_sends_workgroup_id_workgroups_id_fk" FOREIGN KEY ("workgroup_id") REFERENCES "public"."workgroups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "register_years" ADD CONSTRAINT "register_years_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_school_group_id_school_groups_id_fk" FOREIGN KEY ("school_group_id") REFERENCES "public"."school_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "module_admins_user_module_idx" ON "module_admins" USING btree ("user_id","module_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "people_person_id_idx" ON "people" USING btree ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "person_school_assignments_unique" ON "person_school_assignments" USING btree ("person_id","school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "register_certificates_ref_id_idx" ON "register_certificates" USING btree ("ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "register_certificates_year_num_school_idx" ON "register_certificates" USING btree ("year","register_number","school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "register_commands_ref_id_idx" ON "register_commands" USING btree ("ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "register_commands_year_num_school_idx" ON "register_commands" USING btree ("year","register_number","school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "register_receives_ref_id_idx" ON "register_receives" USING btree ("ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "register_receives_year_num_school_idx" ON "register_receives" USING btree ("year","register_number","school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "register_sends_ref_id_idx" ON "register_sends" USING btree ("ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "register_sends_year_num_school_idx" ON "register_sends" USING btree ("year","register_number","school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "register_years_year_school_idx" ON "register_years" USING btree ("year","school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "schools_school_code_idx" ON "schools" USING btree ("school_code");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "users_person_id_idx" ON "users" USING btree ("person_id");