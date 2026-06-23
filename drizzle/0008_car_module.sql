CREATE TABLE IF NOT EXISTS "car_types" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" integer NOT NULL,
  "name" varchar(250) NOT NULL,
  CONSTRAINT "car_types_code_unique" UNIQUE("code")
);

CREATE TABLE IF NOT EXISTS "car_vehicles" (
  "id" serial PRIMARY KEY NOT NULL,
  "car_code" integer NOT NULL,
  "car_type_code" integer NOT NULL,
  "car_number" varchar(100) NOT NULL,
  "name" varchar(150) NOT NULL,
  "pic" varchar(150),
  "status" integer DEFAULT 2 NOT NULL,
  CONSTRAINT "car_vehicles_car_code_unique" UNIQUE("car_code")
);

CREATE TABLE IF NOT EXISTS "car_drivers" (
  "id" serial PRIMARY KEY NOT NULL,
  "person_id" varchar(13) NOT NULL,
  "status" integer DEFAULT 0 NOT NULL,
  "officer_person_id" varchar(13),
  "rec_date" date
);

CREATE TABLE IF NOT EXISTS "car_permissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "p1" integer DEFAULT 0 NOT NULL,
  "officer_person_id" varchar(13)
);

CREATE TABLE IF NOT EXISTS "car_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "person_id" varchar(13) NOT NULL,
  "rec_date" date NOT NULL,
  "car_code" integer NOT NULL,
  "place" varchar(200) NOT NULL,
  "because" varchar(200) NOT NULL,
  "car_start" date NOT NULL,
  "time_start" real,
  "car_finish" date NOT NULL,
  "time_finish" real,
  "day_total" integer,
  "person_num" integer,
  "control_person" varchar(100),
  "fuel" integer NOT NULL,
  "project" varchar(100),
  "activity" varchar(100),
  "money" double precision,
  "self_driver" integer,
  "private_car" integer,
  "car_owner" varchar(100),
  "private_car_number" varchar(100),
  "private_driver" varchar(100),
  "driver_person_id" varchar(13),
  "officer_comment" varchar(150),
  "officer_sign_person_id" varchar(13),
  "officer_date" timestamp,
  "group_comment" varchar(150),
  "group_sign_person_id" varchar(13),
  "group_date" timestamp,
  "grant_comment" varchar(150),
  "commander_grant" integer,
  "commander_sign_person_id" varchar(13),
  "commander_date" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "car_requests_person_id_idx" ON "car_requests" ("person_id");
CREATE INDEX IF NOT EXISTS "car_requests_car_start_idx" ON "car_requests" ("car_start");
CREATE INDEX IF NOT EXISTS "car_drivers_person_id_idx" ON "car_drivers" ("person_id");
