/**
 * Standalone import script for e-Document (`book`) module data.
 *
 * Reads legacy AMSS tables (`book_main`, `book_sendto_answer`, etc.)
 * that were loaded into MySQL via `bash scripts/load-legacy-book.sh`,
 * and migrates into Drizzle tables (`book_documents`, `book_recipients`, …).
 *
 * Usage:
 *   npx tsx scripts/import/import-book-standalone.ts
 */

import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../../src/lib/db";
import {
  bookDocuments,
  bookFiles,
  bookGroupMembers,
  bookGroups,
  bookPermissions,
  bookRecipients,
  people,
  schools,
  users,
} from "../../src/lib/db/schema";
import {
  cleanText,
  legacyTableExists,
  normalizeLegacyDate,
  normalizeLegacyTimestamp,
  parseLegacyPermissionFlag,
  uniqueRefId,
} from "./shared";

type Row = Record<string, unknown>;

const BOOK_SUBJECT_MAX = 500;

function truncateBookSubject(value: unknown): string {
  const text = cleanText(value);
  return text.length > BOOK_SUBJECT_MAX
    ? text.slice(0, BOOK_SUBJECT_MAX)
    : text;
}

async function legacyQuery(table: string): Promise<Row[]> {
  const [rows] = await db.execute(sql.raw(`SELECT * FROM \`${table}\``));
  return rows as Row[];
}

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
      } catch {
        // ignore single row error
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
  const personRows = await db
    .select({ personId: people.personId, workgroupId: people.workgroupId })
    .from(people);

  const schoolMap = new Map(schoolRows.map((s) => [s.schoolCode, s.id]));
  const userMap = new Map(userRows.map((u) => [u.personId, u.id]));
  const personWorkgroups = new Map(personRows.map((p) => [p.personId, p.workgroupId]));

  return { schoolMap, userMap, personWorkgroups };
}

async function truncateTargets() {
  console.log("Truncating book target tables…");
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  const tables = [
    "book_files",
    "book_recipients",
    "book_documents",
    "book_group_members",
    "book_groups",
    "book_permissions",
  ];
  for (const t of tables) {
    await db.execute(sql.raw(`TRUNCATE TABLE \`${t}\``));
  }
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
}

async function importGroups(schoolMap: Map<string, number>) {
  if (!(await legacyTableExists("book_group"))) {
    console.log("  book_group not found — skipping");
    return new Map<number, number>();
  }

  const groupMap = new Map<number, number>();
  const groupRows = await legacyQuery("book_group");

  for (const row of groupRows) {
    const legacyId = Number(row.grp_id);
    const [res] = await db
      .insert(bookGroups)
      .ignore()
      .values({
        legacyId,
        name: cleanText(row.grp_name),
        sortOrder: legacyId,
      });
    const insertedId = (res as any).insertId ?? legacyId;
    groupMap.set(legacyId, insertedId);
  }
  console.log(`  book_groups: ${groupMap.size} groups`);

  if (await legacyTableExists("book_group_member")) {
    const memberRows = await legacyQuery("book_group_member");
    let batch: (typeof bookGroupMembers.$inferInsert)[] = [];
    let count = 0;
    for (const row of memberRows) {
      const groupId = groupMap.get(Number(row.grp_id));
      const schoolCode = String(row.school_id ?? "");
      const schoolId = schoolMap.get(schoolCode);
      if (!groupId || !schoolId) continue;

      batch.push({ groupId, schoolId });
      if (batch.length >= 250) {
        await insertBatchIgnore(bookGroupMembers, batch);
        count += batch.length;
        batch = [];
      }
    }
    if (batch.length) {
      await insertBatchIgnore(bookGroupMembers, batch);
      count += batch.length;
    }
    console.log(`  book_group_members: ${count} members`);
  }

  return groupMap;
}

async function importPermissions(
  userMap: Map<string, number>,
  personWorkgroups: Map<string, number | null>,
) {
  if (!(await legacyTableExists("book_permission"))) {
    console.log("  book_permission not found — skipping");
    return;
  }

  const permRows = await legacyQuery("book_permission");
  const seenUsers = new Set<number>();
  let count = 0;
  for (const row of permRows) {
    const personId = String(row.person_id ?? "");
    const userId = userMap.get(personId);
    if (!userId || seenUsers.has(userId)) continue;
    seenUsers.add(userId);

    const legacyP2 = parseLegacyPermissionFlag(row.p2);
    const workgroupId = legacyP2 > 0 ? (personWorkgroups.get(personId) ?? 0) : 0;

    await db
      .insert(bookPermissions)
      .ignore()
      .values({
        userId,
        p1: parseLegacyPermissionFlag(row.p1),
        p2: workgroupId,
        p3: parseLegacyPermissionFlag(row.p3),
        canViewSecret: false,
      });
    count++;
  }
  console.log(`  book_permissions: ${count} rows`);
}

async function importDocuments(
  schoolMap: Map<string, number>,
  userMap: Map<string, number>,
  personWorkgroups: Map<string, number | null>,
) {
  if (!(await legacyTableExists("book_main"))) {
    console.log("  book_main not found — skipping");
    return new Set<string>();
  }

  const mainRows = await legacyQuery("book_main");
  const validRefIds = new Set<string>();
  const seenRefIds = new Set<string>();

  let batch: (typeof bookDocuments.$inferInsert)[] = [];
  let count = 0;

  for (const row of mainRows) {
    const legacyRefId = String(row.ref_id ?? "");
    const bookType = Number(row.book_type ?? 1);
    const office = String(row.office ?? "");
    const senderPersonId = String(row.sender ?? "");
    const refId = uniqueRefId(
      legacyRefId,
      Number(row.ms_id ?? 0),
      seenRefIds,
    );

    validRefIds.add(refId);
    if (refId !== legacyRefId) {
      validRefIds.add(legacyRefId);
    }

    let senderSchoolId: number | null = null;
    if (bookType === 2) {
      senderSchoolId = schoolMap.get(office) ?? null;
    }

    const sendDate = normalizeLegacyTimestamp(row.send_date) ?? new Date();
    const signDate = normalizeLegacyDate(row.signdate) ?? "1970-01-01";

    batch.push({
      refId,
      bookType,
      senderPersonId,
      officeCode: office,
      senderSchoolId,
      senderWorkgroupId: personWorkgroups.get(senderPersonId) ?? null,
      senderUserId: userMap.get(senderPersonId) ?? null,
      urgencyLevel: Number(row.level ?? 1),
      secretLevel: Number(row.secret ?? 0),
      bookNo: cleanText(row.bookno ?? ""),
      signDate,
      subject: truncateBookSubject(row.subject),
      detail: row.detail ? cleanText(row.detail) : null,
      sendDate,
      bookRegisLink: Number(row.bookregis_link ?? 0),
      createdAt: sendDate,
    });

    if (batch.length >= 250) {
      await insertBatchIgnore(bookDocuments, batch);
      count += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await insertBatchIgnore(bookDocuments, batch);
    count += batch.length;
  }

  console.log(`  book_documents: ${count} rows`);
  return validRefIds;
}

async function importRecipients(validRefIds: Set<string>) {
  if (!(await legacyTableExists("book_sendto_answer"))) {
    console.log("  book_sendto_answer not found — skipping");
    return;
  }

  const recipientRows = await legacyQuery("book_sendto_answer");
  let batch: (typeof bookRecipients.$inferInsert)[] = [];
  let count = 0;

  for (const row of recipientRows) {
    const refId = String(row.ref_id ?? "");
    const sendTo = String(row.send_to ?? "");
    if (!refId || !sendTo || !validRefIds.has(refId)) continue;

    const answered = Number(row.answer ?? 0) !== 0;

    batch.push({
      refId,
      sendLevel: row.send_level != null ? Number(row.send_level) : null,
      sendTo,
      schoolScope: row.school ? String(row.school) : null,
      status: row.status != null ? Number(row.status) : null,
      answered,
      answeredAt: answered ? normalizeLegacyTimestamp(row.answer_time) : null,
      forwardFrom: row.forward_from ? String(row.forward_from) : null,
      forwardReceivedAt: normalizeLegacyTimestamp(row.rec_forward_date),
    });

    if (batch.length >= 500) {
      await insertBatchIgnore(bookRecipients, batch);
      count += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await insertBatchIgnore(bookRecipients, batch);
    count += batch.length;
  }

  console.log(`  book_recipients: ${count} rows`);
}

async function importFiles(validRefIds: Set<string>) {
  if (!(await legacyTableExists("book_filebook"))) {
    console.log("  book_filebook not found — skipping");
    return;
  }

  const fileRows = await legacyQuery("book_filebook");
  let batch: (typeof bookFiles.$inferInsert)[] = [];
  let count = 0;

  for (const row of fileRows) {
    const refId = String(row.ref_id ?? "");
    const fileName = row.file_name ? String(row.file_name).trim() : "";
    if (!refId || !fileName || !validRefIds.has(refId)) continue;

    batch.push({
      refId,
      fileName,
      fileDes: row.file_des ? cleanText(row.file_des) : null,
    });

    if (batch.length >= 500) {
      await insertBatchIgnore(bookFiles, batch);
      count += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await insertBatchIgnore(bookFiles, batch);
    count += batch.length;
  }

  console.log(`  book_files: ${count} rows`);
}

async function main() {
  console.log("=== Import E-Document (book) ===\n");

  if (!(await legacyTableExists("book_main"))) {
    console.error(
      "Legacy table `book_main` not found.\n" +
        "Make sure you've run: bash scripts/load-legacy-book.sh",
    );
    process.exit(1);
  }

  const maps = await buildMaps();
  console.log(
    `Maps: ${maps.schoolMap.size} schools, ${maps.userMap.size} users`,
  );

  await truncateTargets();

  console.log("\nImporting…");
  await importGroups(maps.schoolMap);
  await importPermissions(maps.userMap, maps.personWorkgroups);
  const validRefIds = await importDocuments(
    maps.schoolMap,
    maps.userMap,
    maps.personWorkgroups,
  );
  await importRecipients(validRefIds);
  await importFiles(validRefIds);

  console.log("\n=== Done ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Import failed:", err?.message ?? err);
    process.exit(1);
  });
