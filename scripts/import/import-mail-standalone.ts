/**
 * Standalone import script for internal mail (`mail`) module data.
 *
 * Reads legacy AMSS tables (`mail_main`, `mail_sendto_answer`, etc.)
 * that were loaded into MySQL via `bash scripts/load-legacy-mail.sh`,
 * and migrates into Drizzle tables (`mail_documents`, `mail_recipients`, …).
 *
 * Usage:
 *   npx tsx scripts/import/import-mail-standalone.ts
 */

import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../../src/lib/db";
import {
  mailDocuments,
  mailFiles,
  mailGroupMembers,
  mailGroups,
  mailPermissions,
  mailRecipients,
  people,
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

const MAIL_SUBJECT_MAX = 500;

function truncateMailSubject(value: unknown): string {
  const text = cleanText(value);
  return text.length > MAIL_SUBJECT_MAX
    ? text.slice(0, MAIL_SUBJECT_MAX)
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
  const userRows = await db
    .select({ id: users.id, personId: users.personId })
    .from(users);
  const personRows = await db
    .select({ personId: people.personId, workgroupId: people.workgroupId })
    .from(people);

  const userMap = new Map(userRows.map((u) => [u.personId, u.id]));
  const personWorkgroups = new Map(personRows.map((p) => [p.personId, p.workgroupId]));

  return { userMap, personWorkgroups };
}

async function truncateTargets() {
  console.log("Truncating mail target tables…");
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  const tables = [
    "mail_files",
    "mail_recipients",
    "mail_documents",
    "mail_group_members",
    "mail_groups",
    "mail_permissions",
  ];
  for (const t of tables) {
    await db.execute(sql.raw(`TRUNCATE TABLE \`${t}\``));
  }
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
}

async function importGroups(userMap: Map<string, number>) {
  if (!(await legacyTableExists("mail_group"))) {
    console.log("  mail_group not found — skipping");
    return new Map<number, number>();
  }

  const groupMap = new Map<number, number>();
  const groupRows = await legacyQuery("mail_group");

  for (const row of groupRows) {
    const legacyId = Number(row.grp_id);
    const [res] = await db
      .insert(mailGroups)
      .ignore()
      .values({
        legacyId,
        name: cleanText(row.grp_name),
        sortOrder: legacyId,
      });
    const insertedId = (res as any).insertId ?? legacyId;
    groupMap.set(legacyId, insertedId);
  }
  console.log(`  mail_groups: ${groupMap.size} groups`);

  if (await legacyTableExists("mail_group_member")) {
    const memberRows = await legacyQuery("mail_group_member");
    let batch: (typeof mailGroupMembers.$inferInsert)[] = [];
    let count = 0;
    for (const row of memberRows) {
      const groupId = groupMap.get(Number(row.grp_id));
      const personId = String(row.person_id ?? "");
      const userId = userMap.get(personId);
      if (!groupId || !userId) continue;

      batch.push({ groupId, personId });
      if (batch.length >= 250) {
        await insertBatchIgnore(mailGroupMembers, batch);
        count += batch.length;
        batch = [];
      }
    }
    if (batch.length) {
      await insertBatchIgnore(mailGroupMembers, batch);
      count += batch.length;
    }
    console.log(`  mail_group_members: ${count} members`);
  }

  return groupMap;
}

async function importPermissions(userMap: Map<string, number>) {
  if (!(await legacyTableExists("mail_permission"))) {
    console.log("  mail_permission not found — skipping");
    return;
  }

  const permRows = await legacyQuery("mail_permission");
  const seenUsers = new Set<number>();
  let count = 0;
  for (const row of permRows) {
    const personId = String(row.person_id ?? "");
    const userId = userMap.get(personId);
    if (!userId || seenUsers.has(userId)) continue;
    seenUsers.add(userId);

    await db
      .insert(mailPermissions)
      .ignore()
      .values({
        userId,
        p1: parseLegacyPermissionFlag(row.p1),
      });
    count++;
  }
  console.log(`  mail_permissions: ${count} rows`);
}

async function importDocuments(
  userMap: Map<string, number>,
  personWorkgroups: Map<string, number | null>,
) {
  if (!(await legacyTableExists("mail_main"))) {
    console.log("  mail_main not found — skipping");
    return new Set<string>();
  }

  const mainRows = await legacyQuery("mail_main");
  const validRefIds = new Set<string>();
  const seenRefIds = new Set<string>();

  let batch: (typeof mailDocuments.$inferInsert)[] = [];
  let count = 0;

  for (const row of mainRows) {
    const legacyRefId = String(row.ref_id ?? "");
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

    const sendDate = normalizeLegacyTimestamp(row.send_date) ?? new Date();

    batch.push({
      refId,
      senderPersonId,
      senderWorkgroupId: personWorkgroups.get(senderPersonId) ?? null,
      senderUserId: userMap.get(senderPersonId) ?? null,
      subject: truncateMailSubject(row.subject),
      detail: row.detail ? cleanText(row.detail) : null,
      sendDate,
      createdAt: sendDate,
    });

    if (batch.length >= 250) {
      await insertBatchIgnore(mailDocuments, batch);
      count += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await insertBatchIgnore(mailDocuments, batch);
    count += batch.length;
  }

  console.log(`  mail_documents: ${count} rows`);
  return validRefIds;
}

async function importRecipients(validRefIds: Set<string>, userMap: Map<string, number>) {
  if (!(await legacyTableExists("mail_sendto_answer"))) {
    console.log("  mail_sendto_answer not found — skipping");
    return;
  }

  const recipientRows = await legacyQuery("mail_sendto_answer");
  let batch: (typeof mailRecipients.$inferInsert)[] = [];
  let count = 0;

  for (const row of recipientRows) {
    const refId = String(row.ref_id ?? "");
    const sendToPersonId = String(row.send_to ?? "");
    if (!refId || !sendToPersonId || !validRefIds.has(refId)) continue;
    
    const sendToUserId = userMap.get(sendToPersonId) ?? null;

    const answered = Number(row.answer ?? 0) !== 0;

    batch.push({
      refId,
      sendTo: sendToPersonId,
      answered,
      answeredAt: answered ? normalizeLegacyTimestamp(row.answer_time) : null,
    });

    if (batch.length >= 500) {
      await insertBatchIgnore(mailRecipients, batch);
      count += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await insertBatchIgnore(mailRecipients, batch);
    count += batch.length;
  }

  console.log(`  mail_recipients: ${count} rows`);
}

async function importFiles(validRefIds: Set<string>) {
  if (!(await legacyTableExists("mail_filebook"))) {
    console.log("  mail_filebook not found — skipping");
    return;
  }

  const fileRows = await legacyQuery("mail_filebook");
  let batch: (typeof mailFiles.$inferInsert)[] = [];
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
      await insertBatchIgnore(mailFiles, batch);
      count += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await insertBatchIgnore(mailFiles, batch);
    count += batch.length;
  }

  console.log(`  mail_files: ${count} rows`);
}

async function main() {
  console.log("=== Import Mail ===\n");

  if (!(await legacyTableExists("mail_main"))) {
    console.error(
      "Legacy table `mail_main` not found.\n" +
        "Make sure you've run: bash scripts/load-legacy-mail.sh",
    );
    process.exit(1);
  }

  const maps = await buildMaps();
  console.log(
    `Maps: ${maps.userMap.size} users, ${maps.personWorkgroups.size} workgroups`,
  );

  await truncateTargets();

  console.log("\nImporting…");
  await importGroups(maps.userMap);
  await importPermissions(maps.userMap);
  const validRefIds = await importDocuments(
    maps.userMap,
    maps.personWorkgroups,
  );
  await importRecipients(validRefIds, maps.userMap);
  await importFiles(validRefIds);

  console.log("\n=== Done ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Import failed:", err?.message ?? err);
    process.exit(1);
  });
