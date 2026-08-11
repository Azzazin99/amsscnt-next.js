/**
 * Standalone import script for bookregister module data.
 *
 * Reads legacy AMSS tables (`bookregister_receive`, `bookregister_send`, etc.)
 * that were loaded into the same MySQL database via `db:load-legacy`, and
 * writes into the new drizzle schema (`register_receives`, `register_sends`, …).
 *
 * Usage:
 *   npx tsx scripts/import/import-bookregister.ts
 *
 * The script will TRUNCATE the target tables before importing.
 */

import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../../src/lib/db";
import {
  registerCertificates,
  registerCommands,
  registerPermissions,
  registerReceiveFiles,
  registerReceives,
  registerSendFiles,
  registerSends,
  registerYears,
  schools,
  users,
  workgroups,
} from "../../src/lib/db/schema";
import {
  cleanText,
  legacyTableExists,
  normalizeLegacyDate,
  uniqueRefId,
} from "./shared";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

async function legacyQuery(table: string): Promise<Row[]> {
  const [rows] = await db.execute(sql.raw(`SELECT * FROM \`${table}\``));
  return rows as Row[];
}

// Insert batch using db.insert(...).ignore() or row-by-row fallback if batch fails
async function insertBatchIgnore<T extends Record<string, any>>(
  table: any,
  batch: T[],
) {
  if (batch.length === 0) return;
  try {
    await db.insert(table).ignore().values(batch);
  } catch (err: any) {
    console.warn(`    Batch insert failed (${err?.message ?? err}), falling back to single inserts…`);
    for (const item of batch) {
      try {
        await db.insert(table).ignore().values(item);
      } catch (itemErr: any) {
        // ignore individual failed row
      }
    }
  }
}

async function buildMaps() {
  const schoolRows = await db
    .select({ id: schools.id, schoolCode: schools.schoolCode })
    .from(schools);
  const userRows = await db
    .select({ id: users.id, personId: users.personId })
    .from(users);
  const wgRows = await db
    .select({ id: workgroups.id, sortOrder: workgroups.sortOrder })
    .from(workgroups);

  const schoolMap = new Map(schoolRows.map((s) => [s.schoolCode, s.id]));
  const userMap = new Map(userRows.map((u) => [u.personId, u.id]));

  // workgroupMap: legacy sortOrder (== legacy workgroup id) → new id
  const workgroupMap = new Map(wgRows.map((w) => [w.sortOrder, w.id]));

  return { schoolMap, userMap, workgroupMap };
}

// ---------------------------------------------------------------------------
// Truncate target tables
// ---------------------------------------------------------------------------

async function truncateTargets() {
  console.log("Truncating bookregister target tables…");
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  const tables = [
    "register_certificates",
    "register_commands",
    "register_send_files",
    "register_receive_files",
    "register_sends",
    "register_receives",
    "register_permissions",
    "register_years",
  ];
  for (const t of tables) {
    await db.execute(sql.raw(`TRUNCATE TABLE \`${t}\``));
  }
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
}

// ---------------------------------------------------------------------------
// Import permissions
// ---------------------------------------------------------------------------

async function importPermissions(userMap: Map<string, number>) {
  if (!(await legacyTableExists("bookregister_permission"))) {
    console.log("  bookregister_permission not found — skipping");
    return;
  }
  const rows = await legacyQuery("bookregister_permission");
  const seenUsers = new Set<number>();
  let count = 0;
  for (const row of rows) {
    const userId = userMap.get(String(row.person_id ?? ""));
    if (!userId || seenUsers.has(userId)) continue;
    seenUsers.add(userId);
    await db
      .insert(registerPermissions)
      .ignore()
      .values({
        userId,
        p1: Number(row.p1 ?? 0),
        p2: Number(row.p2 ?? 0),
        p3: 0,
        canViewSecret: false,
      });
    count++;
  }
  console.log(`  register_permissions: ${count} rows`);
}

// ---------------------------------------------------------------------------
// Import years
// ---------------------------------------------------------------------------

async function importYears(schoolMap: Map<string, number>) {
  if (!(await legacyTableExists("bookregister_year"))) {
    console.log("  bookregister_year not found — skipping");
    return;
  }
  const rows = await legacyQuery("bookregister_year");
  let count = 0;
  for (const row of rows) {
    const schoolCode = row.school_code ? String(row.school_code) : null;
    await db
      .insert(registerYears)
      .ignore()
      .values({
        year: Number(row.year),
        schoolId: schoolCode ? (schoolMap.get(schoolCode) ?? null) : null,
        yearActive: Number(row.year_active ?? 0) === 1,
        startReceiveNum: Number(row.start_receive_num ?? 1),
        startSendNum: Number(row.start_send_num ?? 1),
        startCommandNum: Number(row.start_command_num ?? 1),
        startCertificateNum: Number(row.start_cer_num ?? 1),
      });
    count++;
  }
  console.log(`  register_years: ${count} rows`);
}

// ---------------------------------------------------------------------------
// Import receives
// ---------------------------------------------------------------------------

async function importAllReceives(
  schoolMap: Map<string, number>,
  userMap: Map<string, number>,
  workgroupMap: Map<number, number>,
  seenRefIds: Set<string>,
) {
  const defaultWg = [...workgroupMap.values()][0] ?? null;

  async function importReceiveTable(
    table: string,
    schoolId: number | null,
    filterCode?: string,
  ) {
    if (!(await legacyTableExists(table))) return 0;

    let rows: Row[];
    if (filterCode) {
      const [result] = await db.execute(
        sql.raw(
          `SELECT * FROM \`${table}\` WHERE school_code = '${filterCode}'`,
        ),
      );
      rows = result as Row[];
    } else {
      rows = await legacyQuery(table);
    }

    let batch: (typeof registerReceives.$inferInsert)[] = [];
    let count = 0;
    for (const row of rows) {
      batch.push({
        schoolId,
        year: Number(row.year),
        registerNumber: Number(row.register_number),
        bookNo: row.book_no ? cleanText(row.book_no) : null,
        signdate: normalizeLegacyDate(row.signdate),
        bookFrom: cleanText(row.book_from),
        bookTo: cleanText(row.book_to),
        subject: row.subject ? cleanText(row.subject) : null,
        operation: row.operation ? cleanText(row.operation) : null,
        workgroupId:
          workgroupMap.get(Number(row.workgroup ?? 0)) ?? defaultWg,
        recordType: Number(row.record_type ?? 1),
        comment: row.comment ? cleanText(row.comment) : null,
        registerDate: normalizeLegacyDate(row.register_date),
        refId: uniqueRefId(
          String(row.ref_id ?? ""),
          Number(row.ms_id ?? 0),
          seenRefIds,
        ),
        officerId: userMap.get(String(row.officer ?? "")) ?? null,
        bookLink: Number(row.book_link ?? 0),
        source: Number(row.book_link ?? 0) > 0 ? "book_module" : "external",
        secret: Number(row.secret ?? 0) === 1,
        secretLevel: Number(row.secret ?? 0) === 1 ? 1 : 0,
        urgencyLevel: 1,
      });
      if (batch.length >= 250) {
        await insertBatchIgnore(registerReceives, batch);
        count += batch.length;
        batch = [];
      }
    }
    if (batch.length) {
      await insertBatchIgnore(registerReceives, batch);
      count += batch.length;
    }
    return count;
  }

  // District-level receives
  let total = await importReceiveTable("bookregister_receive", null);

  // School-level receives
  if (await legacyTableExists("bookregister_receive_sch")) {
    for (const [code, sid] of schoolMap) {
      total += await importReceiveTable(
        "bookregister_receive_sch",
        sid,
        code,
      );
    }
  }

  console.log(`  register_receives: ${total} rows processed`);
}

// ---------------------------------------------------------------------------
// Import receive files
// ---------------------------------------------------------------------------

async function importReceiveFilebooks() {
  async function doTable(table: string) {
    if (!(await legacyTableExists(table))) return 0;

    const receiveRefRows = await db
      .select({ refId: registerReceives.refId })
      .from(registerReceives);
    const validRefIds = new Set(receiveRefRows.map((r) => r.refId));

    const rows = await legacyQuery(table);
    let batch: (typeof registerReceiveFiles.$inferInsert)[] = [];
    let count = 0;
    for (const row of rows) {
      const refId = row.ref_id ? String(row.ref_id) : "";
      const fileName = row.file_name ? String(row.file_name).trim() : "";
      if (!refId || !fileName || !validRefIds.has(refId)) continue;

      batch.push({
        refId,
        fileName,
        fileDes: row.file_des ? cleanText(row.file_des) : null,
      });
      if (batch.length >= 500) {
        await insertBatchIgnore(registerReceiveFiles, batch);
        count += batch.length;
        batch = [];
      }
    }
    if (batch.length) {
      await insertBatchIgnore(registerReceiveFiles, batch);
      count += batch.length;
    }
    return count;
  }

  let total = await doTable("bookregister_receive_filebook");
  if (await legacyTableExists("bookregister_receive_filebook_sch")) {
    total += await doTable("bookregister_receive_filebook_sch");
  }
  console.log(`  register_receive_files: ${total} rows processed`);
}

// ---------------------------------------------------------------------------
// Import sends
// ---------------------------------------------------------------------------

async function importAllSends(
  schoolMap: Map<string, number>,
  userMap: Map<string, number>,
  workgroupMap: Map<number, number>,
  seenRefIds: Set<string>,
) {
  const defaultWg = [...workgroupMap.values()][0] ?? null;

  async function importSendTable(
    table: string,
    schoolId: number | null,
    filterCode?: string,
  ) {
    if (!(await legacyTableExists(table))) return 0;

    let rows: Row[];
    if (filterCode) {
      const [result] = await db.execute(
        sql.raw(
          `SELECT * FROM \`${table}\` WHERE school_code = '${filterCode}'`,
        ),
      );
      rows = result as Row[];
    } else {
      rows = await legacyQuery(table);
    }

    let batch: (typeof registerSends.$inferInsert)[] = [];
    let count = 0;
    for (const row of rows) {
      batch.push({
        schoolId,
        year: Number(row.year),
        registerNumber: Number(row.register_number),
        bookNo: row.book_no ? cleanText(row.book_no) : null,
        signdate: normalizeLegacyDate(row.signdate),
        bookFrom: cleanText(row.book_from),
        bookTo: cleanText(row.book_to),
        subject: row.subject ? cleanText(row.subject) : null,
        operation: row.operation ? cleanText(row.operation) : null,
        workgroupId:
          workgroupMap.get(Number(row.workgroup ?? 0)) ?? defaultWg,
        comment: row.comment ? cleanText(row.comment) : null,
        registerDate: normalizeLegacyDate(row.register_date),
        refId: uniqueRefId(
          String(row.ref_id ?? ""),
          Number(row.ms_id ?? 0),
          seenRefIds,
        ),
        officerId: userMap.get(String(row.officer ?? "")) ?? null,
        secret: Number(row.secret ?? 0) === 1,
        secretLevel: Number(row.secret ?? 0) === 1 ? 1 : 0,
        urgencyLevel: 1,
        officeType: Number(row.office_type ?? 1),
        forwardedToSchools: false,
      });
      if (batch.length >= 250) {
        await insertBatchIgnore(registerSends, batch);
        count += batch.length;
        batch = [];
      }
    }
    if (batch.length) {
      await insertBatchIgnore(registerSends, batch);
      count += batch.length;
    }
    return count;
  }

  // District-level sends
  let total = await importSendTable("bookregister_send", null);

  // School-level sends
  if (await legacyTableExists("bookregister_send_sch")) {
    for (const [code, sid] of schoolMap) {
      total += await importSendTable("bookregister_send_sch", sid, code);
    }
  }

  console.log(`  register_sends: ${total} rows processed`);
}

// ---------------------------------------------------------------------------
// Import send files
// ---------------------------------------------------------------------------

async function importSendFilebooks() {
  async function doTable(table: string) {
    if (!(await legacyTableExists(table))) return 0;

    const sendRefRows = await db
      .select({ refId: registerSends.refId })
      .from(registerSends);
    const validRefIds = new Set(sendRefRows.map((r) => r.refId));

    const rows = await legacyQuery(table);
    let batch: (typeof registerSendFiles.$inferInsert)[] = [];
    let count = 0;
    for (const row of rows) {
      const refId = row.ref_id ? String(row.ref_id) : "";
      const fileName = row.file_name ? String(row.file_name).trim() : "";
      if (!refId || !fileName || !validRefIds.has(refId)) continue;

      batch.push({
        refId,
        fileName,
        fileDes: row.file_des ? cleanText(row.file_des) : null,
      });
      if (batch.length >= 500) {
        await insertBatchIgnore(registerSendFiles, batch);
        count += batch.length;
        batch = [];
      }
    }
    if (batch.length) {
      await insertBatchIgnore(registerSendFiles, batch);
      count += batch.length;
    }
    return count;
  }

  let total = await doTable("bookregister_send_filebook");
  if (await legacyTableExists("bookregister_send_filebook_sch")) {
    total += await doTable("bookregister_send_filebook_sch");
  }
  console.log(`  register_send_files: ${total} rows processed`);
}

// ---------------------------------------------------------------------------
// Import commands
// ---------------------------------------------------------------------------

async function importCommands(
  userMap: Map<string, number>,
  seenRefIds: Set<string>,
) {
  if (!(await legacyTableExists("bookregister_command"))) {
    console.log("  bookregister_command not found — skipping");
    return;
  }
  const rows = await legacyQuery("bookregister_command");
  let batch: (typeof registerCommands.$inferInsert)[] = [];
  let count = 0;
  for (const row of rows) {
    batch.push({
      schoolId: null,
      year: Number(row.year),
      registerNumber: Number(row.register_number),
      bookNo: row.book_no ? cleanText(row.book_no) : null,
      signdate: normalizeLegacyDate(row.signdate),
      subject: row.subject ? cleanText(row.subject) : null,
      comment: row.comment ? cleanText(row.comment) : null,
      registerDate: normalizeLegacyDate(row.register_date),
      refId: uniqueRefId(
        String(row.ref_id ?? row.id ?? ""),
        Number(row.ms_id ?? row.id ?? 0),
        seenRefIds,
      ),
      officerId: userMap.get(String(row.officer ?? "")) ?? null,
      secret: false,
      fileName: row.file_name ? String(row.file_name) : null,
    });
    if (batch.length >= 250) {
      await insertBatchIgnore(registerCommands, batch);
      count += batch.length;
      batch = [];
    }
  }
  if (batch.length) {
    await insertBatchIgnore(registerCommands, batch);
    count += batch.length;
  }
  console.log(`  register_commands: ${count} rows processed`);
}

// ---------------------------------------------------------------------------
// Import certificates
// ---------------------------------------------------------------------------

async function importCertificates(
  userMap: Map<string, number>,
  seenRefIds: Set<string>,
) {
  if (!(await legacyTableExists("bookregister_certificate"))) {
    console.log("  bookregister_certificate not found — skipping");
    return;
  }
  const rows = await legacyQuery("bookregister_certificate");
  let batch: (typeof registerCertificates.$inferInsert)[] = [];
  let count = 0;
  for (const row of rows) {
    batch.push({
      schoolId: null,
      year: Number(row.year),
      registerNumber: Number(row.register_number),
      bookNo: row.book_no ? cleanText(row.book_no) : null,
      signdate: normalizeLegacyDate(row.signdate),
      subject: row.subject ? cleanText(row.subject) : null,
      comment: row.comment ? cleanText(row.comment) : null,
      registerDate: normalizeLegacyDate(row.register_date),
      refId: uniqueRefId(
        String(row.ref_id ?? row.id ?? ""),
        Number(row.ms_id ?? row.id ?? 0),
        seenRefIds,
      ),
      officerId: userMap.get(String(row.officer ?? "")) ?? null,
      secret: false,
      fileName: row.file_name ? String(row.file_name) : null,
    });
    if (batch.length >= 250) {
      await insertBatchIgnore(registerCertificates, batch);
      count += batch.length;
      batch = [];
    }
  }
  if (batch.length) {
    await insertBatchIgnore(registerCertificates, batch);
    count += batch.length;
  }
  console.log(`  register_certificates: ${count} rows processed`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Import Bookregister ===\n");

  // Verify legacy tables exist
  if (!(await legacyTableExists("bookregister_receive"))) {
    console.error(
      "Legacy table `bookregister_receive` not found.\n" +
        "Make sure you've run: bash scripts/load-legacy-bookregister.sh",
    );
    process.exit(1);
  }

  const maps = await buildMaps();
  console.log(
    `Maps: ${maps.schoolMap.size} schools, ${maps.userMap.size} users, ${maps.workgroupMap.size} workgroups`,
  );

  await truncateTargets();

  const seenRefIds = new Set<string>();

  console.log("\nImporting…");
  await importPermissions(maps.userMap);
  await importYears(maps.schoolMap);
  await importAllReceives(
    maps.schoolMap,
    maps.userMap,
    maps.workgroupMap,
    seenRefIds,
  );
  await importReceiveFilebooks();
  await importAllSends(
    maps.schoolMap,
    maps.userMap,
    maps.workgroupMap,
    seenRefIds,
  );
  await importSendFilebooks();
  await importCommands(maps.userMap, seenRefIds);
  await importCertificates(maps.userMap, seenRefIds);

  console.log("\n=== Done ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Import failed:", err?.message ?? err);
    process.exit(1);
  });
