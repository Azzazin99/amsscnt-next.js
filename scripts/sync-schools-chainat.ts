/**
 * แทนที่รายชื่อ/รหัสโรงเรียนใน DB ด้วยข้อมูล สพป.ชัยนาท จาก Excel
 * (dump legacy มักเป็น สพป.สงขลา — รหัส 9002xxx)
 *
 * Usage: npm run db:sync-schools-chainat
 * Env: CHAINAT_SCHOOLS_XLSX=path/to/file.xlsx (optional)
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import { schools } from "../src/lib/db/schema";
import {
  defaultChainatSchoolsXlsxPath,
  parseChainatSchoolsXlsx,
} from "./parse-chainat-schools-xlsx";

async function main() {
  const xlsxPath = defaultChainatSchoolsXlsxPath();
  const rows = parseChainatSchoolsXlsx(xlsxPath);

  console.log(`อ่านจาก: ${xlsxPath}`);
  console.log(`โรงเรียนใน Excel: ${rows.length} แห่ง`);

  const codes = new Set<string>();
  for (const row of rows) {
    if (codes.has(row.schoolCode)) {
      throw new Error(`รหัสซ้ำใน Excel: ${row.schoolCode}`);
    }
    codes.add(row.schoolCode);
  }

  await db.transaction(async (tx) => {
    // ปลด FK ชั่วคราว — ข้อมูลโรงเรียนใน dump ไม่ตรงเขต
    await tx.execute(sql`UPDATE people SET school_id = NULL WHERE school_id IS NOT NULL`);
    await tx.execute(sql`UPDATE users SET school_id = NULL WHERE school_id IS NOT NULL`);
    await tx.execute(sql`DELETE FROM person_school_assignments`);
    await tx.execute(sql`DELETE FROM schools`);

    await tx.insert(schools).values(
      rows.map((row) => ({
        schoolCode: row.schoolCode,
        name: row.name,
        schoolType: 1,
        schoolGroupId: null,
        active: true,
      })),
    );
  });

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(schools);

  console.log(`sync เสร็จ — schools ใน DB: ${countRow?.total ?? 0} แห่ง`);
  console.log("ตัวอย่าง:", rows.slice(0, 3).map((r) => `${r.schoolCode} ${r.name}`).join(" | "));
  console.log(
    "\nหมายเหตุ: people/users ที่เคยผูก school_id ถูกปลดแล้ว — login โรงเรียนต้องใช้รหัส 101809xxxx จาก Excel",
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
