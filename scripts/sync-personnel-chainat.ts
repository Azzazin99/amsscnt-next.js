/**
 * แทนที่ people + users (เขต) จาก Excel บุคลากร สพป.ชัยนาท
 *
 * Usage: npm run db:sync-personnel-chainat
 * Env:
 *   CHAINAT_PERSONNEL_XLSX — path ไฟล์บุคลากร (optional)
 *   AMSS_OFFICE_CODE — รหัสเขตสำหรับ person_id สังเคราะห์ (default 1701)
 *   AMSS_IMPORT_PASSWORD — รหัสผ่านเริ่มต้นของ user เขต (default Imported123)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { and, eq, ne, sql } from "drizzle-orm";
import {
  buildSchoolCodeByUnitName,
  cleanPhone,
  formatDisplayName,
  isDistrictUnit,
  makeSyntheticPersonId,
  positionCodeFromTitle,
  resolveSchoolCode,
  splitThaiFullName,
} from "./chainat-personnel-utils";
import { db } from "../src/lib/db";
import { people, schools, users } from "../src/lib/db/schema";
import {
  defaultChainatPersonnelXlsxPath,
  parseChainatPersonnelXlsx,
} from "./parse-chainat-personnel-xlsx";

const BATCH = 200;

async function main() {
  const xlsxPath = defaultChainatPersonnelXlsxPath();
  const rows = parseChainatPersonnelXlsx(xlsxPath);
  const officeCode = process.env.AMSS_OFFICE_CODE ?? "1701";
  const password = await bcrypt.hash(
    process.env.AMSS_IMPORT_PASSWORD ?? "Imported123",
    10,
  );

  console.log(`อ่านจาก: ${xlsxPath}`);
  console.log(`บุคลากรใน Excel: ${rows.length} คน`);

  const masterByName = buildSchoolCodeByUnitName();
  const schoolRows = await db
    .select({ id: schools.id, schoolCode: schools.schoolCode })
    .from(schools);
  const schoolIdByCode = new Map(
    schoolRows.map((s) => [String(s.schoolCode), Number(s.id)]),
  );

  type PersonInsert = typeof people.$inferInsert;
  type UserInsert = typeof users.$inferInsert;

  const peopleValues: PersonInsert[] = [];
  const districtUsers: UserInsert[] = [];
  const unmatchedUnits = new Set<string>();
  let seq = 1;

  for (const row of rows) {
    const personId = makeSyntheticPersonId(officeCode, seq++);
    const { firstName, lastName } = splitThaiFullName(row.fullName);
    const positionCode = positionCodeFromTitle(row.position);
    const district = isDistrictUnit(row.unitName);

    let schoolId: number | null = null;
    if (!district) {
      const code = resolveSchoolCode(row.unitName, masterByName);
      if (code) {
        schoolId = schoolIdByCode.get(code) ?? null;
      }
      if (!schoolId) {
        unmatchedUnits.add(row.unitName);
      }
    }

    peopleValues.push({
      personId,
      prefix: null,
      firstName,
      lastName,
      workgroupId: null,
      schoolId: district ? null : schoolId,
      organizationType: district ? "district" : "school",
      positionCode,
      status: 0,
      multiSchool: false,
    });

    if (district) {
      const username = cleanPhone(row.phone);
      if (!username) {
        throw new Error(
          `บุคลากรเขตไม่มีเบอร์โทร: ${row.fullName} (${row.position})`,
        );
      }
      districtUsers.push({
        username,
        personId,
        email: `${username}@chainat.local`,
        passwordHash: password,
        name: formatDisplayName(row),
        organizationType: "district",
        schoolId: null,
        isSuperAdmin: false,
        isAdmin: positionCode === 1,
        status: 1,
      });
    }
  }

  if (unmatchedUnits.size > 0) {
    console.warn(
      `\n⚠ หน่วยงานที่จับคู่โรงเรียนไม่ได้ (${unmatchedUnits.size}):`,
    );
    for (const u of [...unmatchedUnits].sort()) {
      console.warn(`  - ${u}`);
    }
  }

  const districtCount = districtUsers.length;
  const schoolCount = peopleValues.length - districtCount;
  console.log(`\nแยกตามประเภท: เขต ${districtCount} | โรงเรียน ${schoolCount}`);

  await db.transaction(async (tx) => {
    await tx.execute(
      sql`UPDATE register_receives SET officer_id = NULL WHERE officer_id IS NOT NULL`,
    );
    await tx.execute(
      sql`UPDATE register_sends SET officer_id = NULL WHERE officer_id IS NOT NULL`,
    );
    await tx.execute(
      sql`UPDATE register_commands SET officer_id = NULL WHERE officer_id IS NOT NULL`,
    );
    await tx.execute(
      sql`UPDATE register_certificates SET officer_id = NULL WHERE officer_id IS NOT NULL`,
    );

    await tx.execute(sql`DELETE FROM register_permissions`);
    await tx.execute(sql`DELETE FROM module_admins`);

    await tx
      .delete(users)
      .where(
        and(
          eq(users.isSuperAdmin, false),
          ne(users.username, "admin"),
        ),
      );

    await tx.execute(sql`DELETE FROM person_school_assignments`);
    await tx.execute(sql`DELETE FROM people`);

    for (let i = 0; i < peopleValues.length; i += BATCH) {
      await tx.insert(people).values(peopleValues.slice(i, i + BATCH));
    }

    for (let i = 0; i < districtUsers.length; i += BATCH) {
      await tx.insert(users).values(districtUsers.slice(i, i + BATCH));
    }
  });

  const [peopleCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(people);
  const [userCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(users);
  const [schoolPeople] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(people)
    .where(eq(people.organizationType, "school"));
  const [districtPeople] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(people)
    .where(eq(people.organizationType, "district"));

  console.log(`\nsync เสร็จ`);
  console.log(`  people: ${peopleCount?.total ?? 0} (เขต ${districtPeople?.total ?? 0}, โรงเรียน ${schoolPeople?.total ?? 0})`);
  console.log(`  users: ${userCount?.total ?? 0} (รวม admin ที่เก็บไว้)`);
  console.log(
    `\nlogin โรงเรียน: ใช้เลข person_id 13 หลัก (1701xxxxxxxxx) ครั้งแรก`,
  );
  console.log(
    `login เขต: username = เบอร์โทร | รหัสผ่านเริ่มต้น = AMSS_IMPORT_PASSWORD`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
