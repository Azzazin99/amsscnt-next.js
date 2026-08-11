/**
 * Import all personnel from legacy `person_main` and `person_sch_main` into `people` and `users`.
 *
 * Usage:
 *   npm run db:import-personnel
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { people, schools, users, workgroups } from "../../src/lib/db/schema";
import { cleanText, legacyTableExists } from "./shared";

type Row = Record<string, unknown>;

async function legacyQuery(queryStr: string): Promise<Row[]> {
  const [rows] = await db.execute(sql.raw(queryStr));
  return rows as Row[];
}

async function buildMaps() {
  const schoolRows = await db
    .select({ id: schools.id, schoolCode: schools.schoolCode })
    .from(schools);
  const workgroupRows = await db
    .select({ id: workgroups.id, legacyCode: workgroups.legacyCode })
    .from(workgroups);

  const schoolMap = new Map(
    schoolRows
      .filter((s) => s.schoolCode != null)
      .map((s) => [String(s.schoolCode), Number(s.id)]),
  );
  const workgroupMap = new Map(
    workgroupRows
      .filter((w) => w.legacyCode != null)
      .map((w) => [Number(w.legacyCode), Number(w.id)]),
  );

  return { schoolMap, workgroupMap };
}

async function importDistrictPersonnel(workgroupMap: Map<number, number>): Promise<{ peopleCount: number; userCount: number }> {
  if (!(await legacyTableExists("person_main"))) return { peopleCount: 0, userCount: 0 };
  const rows = await legacyQuery("SELECT * FROM `person_main`");
  let peopleCount = 0;
  let userCount = 0;

  const defaultPasswordHash = await bcrypt.hash("Imported123", 10);

  for (const row of rows) {
    const personId = String(row.person_id ?? "").trim();
    if (!personId) continue;

    const prefix = cleanText(row.prename);
    const firstName = cleanText(row.name);
    const lastName = cleanText(row.surname);
    if (!firstName || !lastName) continue;

    const fullName = [prefix, firstName, lastName].filter(Boolean).join(" ");
    const dept = Number(row.department ?? 0);
    const workgroupId = workgroupMap.get(dept) ?? null;
    const status = Number(row.status ?? 0);

    const birthday = row.birthday && String(row.birthday) !== "0000-00-00" ? String(row.birthday) : null;
    const personOrder = Number(row.person_order ?? 0);
    const pictureUrl = row.pic ? String(row.pic) : null;

    // 1. Insert or update people
    await db
      .insert(people)
      .values({
        personId,
        prefix,
        firstName,
        lastName,
        workgroupId,
        organizationType: "district",
        positionCode: Number(row.position_code ?? 0),
        status,
        multiSchool: false,
        birthDate: birthday,
        personOrder,
        pictureUrl,
      })
      .onDuplicateKeyUpdate({
        set: {
          prefix,
          firstName,
          lastName,
          workgroupId,
          organizationType: "district",
          positionCode: Number(row.position_code ?? 0),
          status,
          birthDate: birthday,
          personOrder,
          pictureUrl,
        },
      });
    peopleCount++;

    // 2. Create user login account for active district staff if not existing
    if (status === 0) {
      await db
        .insert(users)
        .values({
          username: personId,
          personId,
          email: `${personId}@amsscnt.go.th`,
          passwordHash: defaultPasswordHash,
          name: fullName,
          organizationType: "district",
          isSuperAdmin: false,
          isAdmin: false,
          status: 1,
        })
        .onDuplicateKeyUpdate({
          set: {
            name: fullName,
            organizationType: "district",
          },
        });
      userCount++;
    }
  }

  return { peopleCount, userCount };
}

async function importSchoolPersonnel(schoolMap: Map<string, number>): Promise<number> {
  if (!(await legacyTableExists("person_sch_main"))) return 0;
  const rows = await legacyQuery("SELECT * FROM `person_sch_main`");
  let count = 0;

  for (const row of rows) {
    const personId = String(row.person_id ?? "").trim();
    if (!personId) continue;

    const prefix = cleanText(row.prename);
    const firstName = cleanText(row.name);
    const lastName = cleanText(row.surname);
    if (!firstName || !lastName) continue;

    const schoolCode = String(row.school_code ?? "").trim();
    const schoolId = schoolCode ? schoolMap.get(schoolCode) ?? null : null;

    await db
      .insert(people)
      .values({
        personId,
        prefix,
        firstName,
        lastName,
        schoolId,
        organizationType: "school",
        positionCode: Number(row.position_code ?? 0),
        status: Number(row.status ?? 0),
        multiSchool: false,
      })
      .onDuplicateKeyUpdate({
        set: {
          prefix,
          firstName,
          lastName,
          schoolId,
          organizationType: "school",
          positionCode: Number(row.position_code ?? 0),
          status: Number(row.status ?? 0),
        },
      });

    count++;
  }

  return count;
}

async function main() {
  console.log("=== Import Personnel (person_main + person_sch_main) ===\n");

  const maps = await buildMaps();
  console.log(
    `Maps: ${maps.schoolMap.size} schools, ${maps.workgroupMap.size} workgroups`,
  );

  console.log("\nImporting personnel…");
  const districtRes = await importDistrictPersonnel(maps.workgroupMap);
  console.log(`  district personnel (person_main): ${districtRes.peopleCount} people, ${districtRes.userCount} users synced`);

  const schoolCount = await importSchoolPersonnel(maps.schoolMap);
  console.log(`  school personnel (person_sch_main): ${schoolCount} records`);

  console.log("\n=== Done ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Import failed:", err?.message ?? err);
    process.exit(1);
  });
