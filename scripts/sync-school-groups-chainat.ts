/**
 * แทนที่กลุ่มสถานศึกษา + ผูกโรงเรียน จาก _สพป.ชัยนาท.xlsx (คอลัมน์ H)
 *
 * Usage: npm run db:sync-school-groups-chainat
 * Env: CHAINAT_MASTER_XLSX=path/to/file.xlsx (optional)
 */
import "dotenv/config";
import { inArray, sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import { schoolGroups, schools } from "../src/lib/db/schema";
import {
  defaultChainatMasterXlsxPath,
  parseChainatMasterXlsx,
} from "./parse-chainat-master-xlsx";

async function main() {
  const xlsxPath = defaultChainatMasterXlsxPath();
  const { groups, assignments } = parseChainatMasterXlsx(xlsxPath);

  console.log(`อ่านจาก: ${xlsxPath}`);
  console.log(`กลุ่มใน Excel: ${groups.length} กลุ่ม`);
  console.log(`การผูกโรงเรียน: ${assignments.length} รายการ`);

  const groupNameToId = new Map<string, number>();

  await db.transaction(async (tx) => {
    await tx.execute(sql`UPDATE schools SET school_group_id = NULL`);
    await tx.execute(sql`DELETE FROM school_groups`);

    for (const group of groups) {
      const [inserted] = await tx
        .insert(schoolGroups)
        .values({
          name: group.name,
          sortOrder: group.sortOrder,
          legacyId: null,
        })
        .returning({ id: schoolGroups.id });

      if (!inserted) {
        throw new Error(`ไม่สามารถสร้างกลุ่ม: ${group.name}`);
      }
      groupNameToId.set(group.name, inserted.id);
    }

    const byGroup = new Map<string, string[]>();
    for (const row of assignments) {
      const groupId = groupNameToId.get(row.groupName);
      if (!groupId) continue;
      const list = byGroup.get(row.groupName) ?? [];
      list.push(row.schoolCode);
      byGroup.set(row.groupName, list);
    }

    let linked = 0;
    for (const [groupName, codes] of byGroup) {
      const groupId = groupNameToId.get(groupName);
      if (!groupId) continue;

      const updated = await tx
        .update(schools)
        .set({ schoolGroupId: groupId })
        .where(inArray(schools.schoolCode, codes))
        .returning({ id: schools.id });

      linked += updated.length;
    }

    console.log(`ผูก school_group_id แล้ว: ${linked} โรงเรียน`);
  });

  const [groupCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(schoolGroups);

  const [unassigned] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(schools)
    .where(sql`school_group_id IS NULL`);

  console.log(`sync เสร็จ — กลุ่มใน DB: ${groupCount?.total ?? 0}`);
  console.log(`โรงเรียนที่ยังไม่มีกลุ่ม: ${unassigned?.total ?? 0} แห่ง`);
  console.log(
    "ตัวอย่างกลุ่ม:",
    groups
      .slice(0, 3)
      .map((g) => g.name)
      .join(" | "),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
