/**
 * Backfill people.service_start_date จาก legacy person_detail.start_day
 *
 * Usage: npm run db:backfill-service-start
 * ต้องมีตาราง person_detail (รัน db:load-legacy ก่อนถ้ายังไม่มี)
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, queryClient } from "../src/lib/db";
import { legacyTableExists } from "./import/shared";

async function main() {
  const hasPersonDetail = await legacyTableExists("person_detail");
  if (!hasPersonDetail) {
    console.error("ไม่พบตาราง person_detail — รัน npm run db:load-legacy ก่อน");
    process.exit(1);
  }

  const updated = await db.execute(sql`
    UPDATE people p
    SET service_start_date = pd.start_day
    FROM person_detail pd
    WHERE p.person_id = pd.person_id
      AND p.service_start_date IS NULL
      AND pd.start_day IS NOT NULL
      AND pd.start_day::text NOT IN ('0000-00-00', '0001-01-01')
  `);

  const rowCount =
    typeof updated === "object" &&
    updated !== null &&
    "rowCount" in updated &&
    typeof updated.rowCount === "number"
      ? updated.rowCount
      : null;

  const [withDate] = await queryClient<{ count: string }[]>`
    SELECT count(*)::text AS count FROM people WHERE service_start_date IS NOT NULL
  `;
  const [stillNull] = await queryClient<{ count: string }[]>`
    SELECT count(*)::text AS count FROM people WHERE service_start_date IS NULL
  `;

  console.log(
    rowCount !== null
      ? `อัปเดต service_start_date: ${rowCount} คน`
      : "อัปเดต service_start_date เสร็จแล้ว",
  );
  console.log(`มีวันเริ่มราชการ: ${withDate?.count ?? "?"}`);
  console.log(`ยังไม่มีวันเริ่มราชการ: ${stillNull?.count ?? "?"}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
