/**
 * ลบแถว stub ประวัติลาใน people (import จาก la_* เมื่อไม่มีชื่อใน person_main)
 *
 * เกณฑ์: first_name = 'ประวัติลา' AND last_name = person_id
 * ข้าม: มีบัญชี users ที่ person_id ตรงกัน
 *
 * ไม่ลบ leave_requests — ประวัติลายังอยู่ อ้าง person_id เดิม
 *
 * Usage:
 *   npm run db:delete-legacy-leave-stubs
 *   npm run db:delete-legacy-leave-stubs -- --dry-run
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, queryClient } from "../src/lib/db";
import { LEGACY_LEAVE_STUB_FIRST_NAME } from "../src/lib/leave/display-name";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const [{ count: stubCount }] = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text AS count
    FROM people p
    WHERE p.first_name = ${LEGACY_LEAVE_STUB_FIRST_NAME}
      AND p.last_name = p.person_id
  `);

  const [{ count: withUsers }] = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text AS count
    FROM people p
    INNER JOIN users u ON u.person_id = p.person_id
    WHERE p.first_name = ${LEGACY_LEAVE_STUB_FIRST_NAME}
      AND p.last_name = p.person_id
  `);

  const deletable = Number(stubCount) - Number(withUsers);

  console.log(`stub ประวัติลาใน people: ${stubCount}`);
  console.log(`มีบัญชี users (ข้าม): ${withUsers}`);
  console.log(`จะลบ: ${deletable}`);

  if (deletable === 0) {
    console.log("ไม่มีแถวที่ลบได้");
    // queryClient.end() not needed for mysql pool
    return;
  }

  if (dryRun) {
    const rows = await db.execute<{ person_id: string }>(sql`
      SELECT p.person_id
      FROM people p
      WHERE p.first_name = ${LEGACY_LEAVE_STUB_FIRST_NAME}
        AND p.last_name = p.person_id
        AND NOT EXISTS (
          SELECT 1 FROM users u WHERE u.person_id = p.person_id
        )
      ORDER BY p.person_id
      LIMIT 20
    `);
    console.log("ตัวอย่าง person_id (สูงสุด 20):");
    for (const row of rows) {
      console.log(`  ${row.person_id}`);
    }
    console.log("(dry-run — ไม่ลบจริง)");
    // queryClient.end() not needed for mysql pool
    return;
  }

  const deleted = await db.execute<{ person_id: string }>(sql`
    DELETE FROM people p
    WHERE p.first_name = ${LEGACY_LEAVE_STUB_FIRST_NAME}
      AND p.last_name = p.person_id
      AND NOT EXISTS (
        SELECT 1 FROM users u WHERE u.person_id = p.person_id
      )
    RETURNING p.person_id
  `);

  console.log(`ลบแล้ว ${deleted.length} แถว`);
  // queryClient.end() not needed for mysql pool
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
