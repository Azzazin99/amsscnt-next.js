CREATE TABLE IF NOT EXISTS "meeting_rooms" (
  "id" serial PRIMARY KEY NOT NULL,
  "room_code" integer NOT NULL,
  "room_name" varchar(100) NOT NULL,
  "active" boolean DEFAULT false NOT NULL,
  CONSTRAINT "meeting_rooms_room_code_unique" UNIQUE("room_code")
);

CREATE TABLE IF NOT EXISTS "meeting_permissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "p1" integer DEFAULT 0 NOT NULL,
  "officer_person_id" varchar(13)
);

CREATE TABLE IF NOT EXISTS "meeting_bookings" (
  "id" serial PRIMARY KEY NOT NULL,
  "room_code" integer NOT NULL,
  "book_date" date NOT NULL,
  "book_date_end" date NOT NULL,
  "start_time" integer NOT NULL,
  "finish_time" integer NOT NULL,
  "objective" varchar(200) NOT NULL,
  "person_num" integer,
  "other" varchar(200),
  "book_person_id" varchar(13) NOT NULL,
  "rec_date" timestamp DEFAULT now() NOT NULL,
  "approve" integer,
  "reason" varchar(200),
  "officer_person_id" varchar(13),
  "officer_date" timestamp
);

CREATE INDEX IF NOT EXISTS "meeting_bookings_room_code_idx" ON "meeting_bookings" ("room_code");
CREATE INDEX IF NOT EXISTS "meeting_bookings_book_date_idx" ON "meeting_bookings" ("book_date");
CREATE INDEX IF NOT EXISTS "meeting_bookings_book_person_id_idx" ON "meeting_bookings" ("book_person_id");

INSERT INTO "meeting_rooms" ("room_code", "room_name", "active") VALUES
  (1, 'ห้องประชุม1', true),
  (2, 'ห้องประชุม2', false),
  (3, 'ห้องประชุม3', false),
  (4, 'หอ้งประชุม4', false),
  (5, 'ห้องประชุม5', false),
  (6, 'ห้องประชุม6', false),
  (7, 'ห้องประชุม7', false),
  (8, 'ห้องประชุม8', false),
  (9, 'ห้องประชุม9', false),
  (10, 'ห้องประชุม10', false)
ON CONFLICT ("room_code") DO NOTHING;
