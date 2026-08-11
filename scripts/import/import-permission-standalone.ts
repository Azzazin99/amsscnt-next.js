/**
 * Standalone import script for Official Travel (`permission`) module data.
 *
 * Reads legacy AMSS tables (`permission_main`, `permission_date`, `permission_permission`, `permission_person_set`)
 * that were loaded into MySQL via `bash scripts/load-legacy-permission.sh`,
 * and migrates into Drizzle tables (`permission_requests`, `permission_permissions`, `permission_person_settings`).
 *
 * Usage:
 *   npx tsx scripts/import/import-permission-standalone.ts
 */

import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../../src/lib/db";
import {
  permissionPermissions,
  permissionPersonSettings,
  permissionRequests,
  schools,
  users,
} from "../../src/lib/db/schema";
import {
  cleanText,
  legacyTableExists,
  normalizeLegacyDate,
  normalizeLegacyTimestamp,
  parseLegacyPermissionFlag,
} from "./shared";

type Row = Record<string, unknown>;

const SUBJECT_MAX = 150;
const PLACE_MAX = 150;

function truncateText(value: unknown, maxLen: number): string {
  const text = cleanText(value);
  return text.length > maxLen ? text.slice(0, maxLen) : text;
}

async function legacyQuery(queryStr: string): Promise<Row[]> {
  const [rows] = await db.execute(sql.raw(queryStr));
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
    console.warn(
      `    Batch insert failed (${err?.message ?? err}), falling back to single inserts…`,
    );
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

  const schoolMap = new Map(schoolRows.map((s) => [s.schoolCode, s.id]));
  const userMap = new Map(userRows.map((u) => [u.personId, u.id]));

  return { schoolMap, userMap };
}

async function truncateTargets() {
  console.log("Truncating permission target tables…");
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  const tables = [
    "permission_requests",
    "permission_permissions",
    "permission_person_settings",
  ];
  for (const t of tables) {
    await db.execute(sql.raw(`TRUNCATE TABLE \`${t}\``));
  }
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
}

async function importPermissions(userMap: Map<string, number>) {
  if (!(await legacyTableExists("permission_permission"))) {
    console.log("  permission_permission not found — skipping");
    return;
  }

  const permRows = await legacyQuery("SELECT * FROM `permission_permission`");
  const seenUsers = new Set<number>();
  let count = 0;

  for (const row of permRows) {
    const personId = String(row.person_id ?? "");
    const userId = userMap.get(personId);
    if (!userId || seenUsers.has(userId)) continue;
    seenUsers.add(userId);

    const officerPersonId = row.officer ? String(row.officer) : null;

    await db
      .insert(permissionPermissions)
      .ignore()
      .values({
        userId,
        p1: parseLegacyPermissionFlag(row.p1),
        p2: parseLegacyPermissionFlag(row.p2),
        officerPersonId,
      });
    count++;
  }
  console.log(`  permission_permissions: ${count} rows`);
}

async function importPersonSettings() {
  if (!(await legacyTableExists("permission_person_set"))) {
    console.log("  permission_person_set not found — skipping");
    return;
  }

  const setRows = await legacyQuery("SELECT * FROM `permission_person_set`");
  const seenPeople = new Set<string>();
  let batch: (typeof permissionPersonSettings.$inferInsert)[] = [];
  let count = 0;

  for (const row of setRows) {
    const personId = String(row.person_id ?? "");
    if (!personId || seenPeople.has(personId)) continue;
    seenPeople.add(personId);

    const groupPersonId = row.comment_person
      ? String(row.comment_person)
      : null;
    const grantPersonId = row.grant_person ? String(row.grant_person) : null;

    batch.push({
      personId,
      groupPersonId,
      grantPersonId,
    });

    if (batch.length >= 500) {
      await insertBatchIgnore(permissionPersonSettings, batch);
      count += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await insertBatchIgnore(permissionPersonSettings, batch);
    count += batch.length;
  }

  console.log(`  permission_person_settings: ${count} rows`);
}

async function fetchDateRangesMap(): Promise<
  Map<string, { start: string; finish: string }>
> {
  const dateMap = new Map<string, { start: string; finish: string }>();

  if (!(await legacyTableExists("permission_date"))) {
    return dateMap;
  }

  const rows = await legacyQuery(
    "SELECT ref_id, MIN(date) as min_date, MAX(date) as max_date FROM `permission_date` GROUP BY ref_id",
  );

  for (const row of rows) {
    const refId = String(row.ref_id ?? "");
    if (!refId) continue;
    const minDateStr = normalizeLegacyDate(row.min_date);
    const maxDateStr = normalizeLegacyDate(row.max_date);
    if (minDateStr && maxDateStr) {
      dateMap.set(refId, { start: minDateStr, finish: maxDateStr });
    }
  }

  return dateMap;
}

async function importRequests(schoolMap: Map<string, number>) {
  if (!(await legacyTableExists("permission_main"))) {
    console.log("  permission_main not found — skipping");
    return;
  }

  const dateMap = await fetchDateRangesMap();
  const mainRows = await legacyQuery("SELECT * FROM `permission_main`");
  const seenRefIds = new Set<string>();

  let batch: (typeof permissionRequests.$inferInsert)[] = [];
  let count = 0;

  for (const row of mainRows) {
    const refId = String(row.ref_id ?? "");
    const personId = String(row.person_id ?? "");
    if (!refId || !personId || seenRefIds.has(refId)) continue;
    seenRefIds.add(refId);

    const schoolCode = String(row.school_code ?? "").trim();
    const schoolId = schoolCode ? schoolMap.get(schoolCode) ?? null : null;

    const subject = truncateText(row.subject ?? "ขออนุมัติไปราชการ", SUBJECT_MAX);
    const place = truncateText(row.place ?? "-", PLACE_MAX);

    const dateRange = dateMap.get(refId);
    const fallbackDate =
      normalizeLegacyDate(row.rec_date) ?? "1970-01-01";
    const travelStart = dateRange?.start ?? fallbackDate;
    const travelFinish = dateRange?.finish ?? fallbackDate;

    const createdAt =
      normalizeLegacyTimestamp(row.rec_date) ?? new Date();

    const basicGrant = row.no_comment != null ? Number(row.no_comment) : null;
    const basicComment = row.comment ? cleanText(row.comment) : null;
    const basicDate = normalizeLegacyTimestamp(row.comment_date);

    const grantStatus = row.grant_x != null ? Number(row.grant_x) : null;
    const grantComment = row.grant_comment ? cleanText(row.grant_comment) : null;
    const grantPersonId = row.grant_person ? String(row.grant_person) : null;
    const grantDate = normalizeLegacyTimestamp(row.grant_date);

    batch.push({
      refId,
      personId,
      schoolId,
      subject,
      place,
      travelStart,
      travelFinish,
      vehicle: row.vehicle ? cleanText(row.vehicle) : null,
      document: row.document ? cleanText(row.document) : null,
      grantStatus,
      grantComment,
      grantPersonId,
      grantDate,
      basicGrant,
      basicComment,
      basicDate,
      createdAt,
    });

    if (batch.length >= 250) {
      await insertBatchIgnore(permissionRequests, batch);
      count += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await insertBatchIgnore(permissionRequests, batch);
    count += batch.length;
  }

  console.log(`  permission_requests: ${count} rows`);
}

async function main() {
  console.log("=== Import Official Travel (permission) ===\n");

  if (!(await legacyTableExists("permission_main"))) {
    console.error(
      "Legacy table `permission_main` not found.\n" +
        "Make sure you've run: bash scripts/load-legacy-permission.sh",
    );
    process.exit(1);
  }

  const maps = await buildMaps();
  console.log(
    `Maps: ${maps.schoolMap.size} schools, ${maps.userMap.size} users`,
  );

  await truncateTargets();

  console.log("\nImporting…");
  await importPermissions(maps.userMap);
  await importPersonSettings();
  await importRequests(maps.schoolMap);

  console.log("\n=== Done ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Import failed:", err?.message ?? err);
    process.exit(1);
  });
