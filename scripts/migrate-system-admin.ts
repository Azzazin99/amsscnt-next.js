/**
 * ย้ายผู้ดูแลระบบจาก username=admin → นักวิชาการคอมพิวเตอร์เขต (position_code=15)
 *
 * Usage:
 *   npm run db:migrate-system-admin
 *   npm run db:migrate-system-admin -- --dry-run
 */
import "dotenv/config";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../src/lib/db";
import { people, users } from "../src/lib/db/schema";

const IT_POSITION_CODE = 15;

function assertMigrateAllowed(): void {
  if (process.env.AMSS_MIGRATE_OK === "1") return;

  const url = process.env.DATABASE_URL ?? "";
  const isLocal =
    /localhost|127\.0\.0\.1/i.test(url) ||
    url.includes("@postgres:") ||
    url.includes("@postgres/");

  if (!isLocal) {
    console.error(
      "ปฏิเสธ migration — DATABASE_URL ไม่ใช่ localhost\n" +
        "ตั้ง AMSS_MIGRATE_OK=1 เฉพาะเมื่อแน่ใจว่าเป็น DB ที่ต้องการ",
    );
    process.exit(1);
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  assertMigrateAllowed();

  const itPeople = await db
    .select({
      personId: people.personId,
      firstName: people.firstName,
      lastName: people.lastName,
    })
    .from(people)
    .where(
      and(
        eq(people.positionCode, IT_POSITION_CODE),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    );

  const itPersonIds = itPeople.map((p) => p.personId);

  const activeUsers =
    itPersonIds.length > 0
      ? await db
          .select({
            id: users.id,
            personId: users.personId,
            username: users.username,
            isAdmin: users.isAdmin,
            isSuperAdmin: users.isSuperAdmin,
          })
          .from(users)
          .where(
            and(
              inArray(users.personId, itPersonIds),
              eq(users.status, 1),
            ),
          )
      : [];

  const usersByPerson = new Map(activeUsers.map((u) => [u.personId, u]));
  const missingUsers = itPeople.filter((p) => !usersByPerson.has(p.personId));

  const toGrant = activeUsers.filter((u) => !u.isAdmin || !u.isSuperAdmin);

  const [legacyAdmin] = await db
    .select({ id: users.id, status: users.status })
    .from(users)
    .where(eq(users.username, "admin"))
    .limit(1);

  console.log(dryRun ? "[dry-run] migrate-system-admin" : "migrate-system-admin");
  console.log(`  นักวิชาการคอมพิวเตอร์ (position ${IT_POSITION_CODE}, เขต): ${itPeople.length} คน`);
  console.log(`  มี users active: ${activeUsers.length} คน`);
  console.log(`  จะ grant is_admin: ${toGrant.length} คน`);

  for (const u of toGrant) {
    const person = itPeople.find((p) => p.personId === u.personId);
    const name = person
      ? `${person.firstName} ${person.lastName}`
      : u.username;
    console.log(`    → ${u.personId} (${name})`);
  }

  if (missingUsers.length > 0) {
    console.warn(`  warn: ${missingUsers.length} คนไม่มีแถว users — สร้าง user ก่อนแล้วรันซ้ำ:`);
    for (const p of missingUsers) {
      console.warn(`    - ${p.personId} ${p.firstName} ${p.lastName}`);
    }
  }

  if (legacyAdmin) {
    console.log(
      `  username=admin: status=${legacyAdmin.status} → ${dryRun ? "0 (dry-run)" : "0"}`,
    );
  } else {
    console.log("  username=admin: ไม่พบใน DB");
  }

  if (dryRun) {
    console.log("dry-run complete — ไม่มีการเปลี่ยนแปลง");
    return;
  }

  if (toGrant.length > 0) {
    await db
      .update(users)
      .set({
        isAdmin: true,
        isSuperAdmin: true,
        updatedAt: new Date(),
      })
      .where(
        inArray(
          users.id,
          toGrant.map((u) => u.id),
        ),
      );
  }

  if (legacyAdmin && legacyAdmin.status === 1) {
    await db
      .update(users)
      .set({ status: 0, updatedAt: new Date() })
      .where(eq(users.id, legacyAdmin.id));
  }

  console.log("migration complete");
  if (activeUsers.length > 0) {
    console.log("  Login ด้วยเลขบัตรนักวิชาการคอมพิวเตอร์ + รหัสเดิม → /admin");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
