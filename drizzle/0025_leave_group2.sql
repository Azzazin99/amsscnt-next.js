ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "group_comment2" varchar(100);
ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "group_sign2_person_id" varchar(13);
ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "group_date2" timestamp;
