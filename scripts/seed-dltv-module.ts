/**
 * เพิ่ม/อัปเดตโมดูล dltv (การศึกษาทางไกล) — มีใน Amssplus ชัยนาท แต่ไม่มีใน dump import
 *
 * Usage: npm run db:seed-dltv-module
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { menuGroups, modules } from "../src/lib/db/schema";

const ACADEMIC_GROUP_LEGACY_ID = 4;
const DLTV_SLUG = "dltv";

async function main() {
  const [group] = await db
    .select({ id: menuGroups.id })
    .from(menuGroups)
    .where(eq(menuGroups.legacyId, ACADEMIC_GROUP_LEGACY_ID))
    .limit(1);

  if (!group) {
    console.error(
      `ไม่พบ menu_groups.legacy_id = ${ACADEMIC_GROUP_LEGACY_ID} — รัน db:import-smart-area ก่อน`,
    );
    process.exit(1);
  }

  const [existing] = await db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.slug, DLTV_SLUG))
    .limit(1);

  const values = {
    slug: DLTV_SLUG,
    name: "การศึกษาทางไกล",
    menuGroupId: group.id,
    whereWork: 0,
    active: true,
    sortOrder: 50,
  };

  if (existing) {
    await db.update(modules).set(values).where(eq(modules.id, existing.id));
    console.log(`อัปเดต modules.slug = ${DLTV_SLUG} (id ${existing.id})`);
  } else {
    const [inserted] = await db.insert(modules).values(values).returning({ id: modules.id });
    console.log(`เพิ่ม modules.slug = ${DLTV_SLUG} (id ${inserted.id})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
