/**
 * อัปเดตกลุ่มงานเป็นข้อมูล สพป.ชัยนาท (upsert ตาม legacy_code — คง FK เดิม)
 *
 * Usage: npm run db:sync-workgroups-chainat
 */
import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import { workgroups } from "../src/lib/db/schema";
import { CHAINAT_WORKGROUPS } from "./data/workgroups-chainat";

async function main() {
  console.log(`กลุ่มงานชัยนาท: ${CHAINAT_WORKGROUPS.length} รายการ`);

  await db.transaction(async (tx) => {
    for (const row of CHAINAT_WORKGROUPS) {
      const [existing] = await tx
        .select({ id: workgroups.id })
        .from(workgroups)
        .where(eq(workgroups.legacyCode, row.legacyCode))
        .limit(1);

      if (existing) {
        await tx
          .update(workgroups)
          .set({
            name: row.name,
            sortOrder: row.sortOrder,
            active: true,
          })
          .where(eq(workgroups.id, existing.id));
      } else {
        await tx.insert(workgroups).values({
          legacyCode: row.legacyCode,
          name: row.name,
          sortOrder: row.sortOrder,
          active: true,
        });
      }
    }
  });

  const rows = await db
    .select({
      legacyCode: workgroups.legacyCode,
      name: workgroups.name,
      sortOrder: workgroups.sortOrder,
    })
    .from(workgroups)
    .orderBy(workgroups.sortOrder);

  const [total] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(workgroups);

  console.log(`sync เสร็จ — workgroups ใน DB: ${total?.n ?? 0}`);
  console.log(
    "ตัวอย่าง:",
    rows
      .slice(0, 3)
      .map((r) => `${r.legacyCode} ${r.name}`)
      .join(" | "),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
