import { eq } from "drizzle-orm";
import { db, queryClient } from "../../src/lib/db";
import { syncQuotaBalance } from "../../src/lib/leave/quota";
import { budgetYearFromIsoDate } from "../../src/lib/leave/regulation/fiscal-year";
import type { LeaveTypeId } from "../../src/lib/leave/regulation/types";
import {
  leaveCancellations,
  leaveCollect,
  leavePermissions,
  leavePersonSettings,
  leaveRequests,
  leaveYears,
  people,
} from "../../src/lib/db/schema";
import { ensureLeavePeopleFromLegacy } from "./backfill-leave-people";
import {
  flushBatch,
  legacyPersonId,
  legacyReal,
  legacyTableExists,
  leaveRequestDedupKey,
  normalizeLegacyDate,
  normalizeLegacyTimestamp,
  parseLegacyBool,
  parseLegacyPermissionFlag,
  type ImportMaps,
} from "./shared";

export type ImportLeaveOptions = {
  /** Skip post-import quota sync (for tests). */
  skipQuotaSync?: boolean;
  /** Skip stub people from la_* person_ids (default: backfill enabled). */
  skipPeopleBackfill?: boolean;
};

export type ImportLeaveResult = {
  years: number;
  permissions: number;
  personSettings: number;
  collect: number;
  peopleBackfilled: number;
  peopleBackfillSkippedExisting: number;
  peopleNamesRefreshed: number;
  requestsInserted: number;
  requestsSkippedExisting: number;
  requestsSkippedNoPerson: number;
  cancellationsInserted: number;
  cancellationsSkippedExisting: number;
  cancellationsSkippedNoSource: number;
  cancellationsSkippedNoPerson: number;
  quotaBalancesSynced: number;
};

const QUOTA_TYPES: LeaveTypeId[] = [2, 3, 4, 5];

async function loadPeopleIds(): Promise<Set<string>> {
  const rows = await db.select({ personId: people.personId }).from(people);
  return new Set(rows.map((r) => r.personId));
}

async function loadExistingRequestKeys(): Promise<Set<string>> {
  const rows = await db
    .select({
      personId: leaveRequests.personId,
      leaveStart: leaveRequests.leaveStart,
      leaveFinish: leaveRequests.leaveFinish,
      leaveType: leaveRequests.leaveType,
      leaveTotal: leaveRequests.leaveTotal,
      commanderGrant: leaveRequests.commanderGrant,
    })
    .from(leaveRequests);

  return new Set(
    rows.map((r) =>
      leaveRequestDedupKey({
        personId: r.personId,
        leaveStart: r.leaveStart,
        leaveFinish: r.leaveFinish,
        leaveType: r.leaveType,
        leaveTotal: r.leaveTotal,
        commanderGrant: r.commanderGrant,
      }),
    ),
  );
}

function mapLeaveRequestRow(
  row: Record<string, unknown>,
  maps: ImportMaps,
  peopleIds: Set<string>,
): { row: typeof leaveRequests.$inferInsert | null; skipReason?: string } {
  const personId = String(row.person_id ?? "");
  if (!peopleIds.has(personId)) {
    return { row: null, skipReason: "no_person" };
  }

  const leaveStart = normalizeLegacyDate(row.la_start);
  const leaveFinish = normalizeLegacyDate(row.la_finish);
  if (!leaveStart || !leaveFinish) {
    return { row: null, skipReason: "invalid_date" };
  }

  const schoolCode = String(row.school_code ?? "").trim();
  const schoolId = schoolCode ? (maps.schoolMap.get(schoolCode) ?? null) : null;

  const commanderGrant =
    row.commander_grant == null || row.commander_grant === ""
      ? null
      : Number(row.commander_grant);

  return {
    row: {
      personId,
      schoolId,
      leaveType: Number(row.la_type ?? 0),
      writeAt: row.write_at ? String(row.write_at) : null,
      because: row.because ? String(row.because) : null,
      leaveStart,
      leaveFinish,
      leaveTotal: Number(row.la_total ?? 0),
      lastLeaveStart: normalizeLegacyDate(row.last_la_start),
      lastLeaveFinish: normalizeLegacyDate(row.last_la_finish),
      lastLeaveTotal: legacyReal(row.last_la_total),
      sickAgo: legacyReal(row.sick_ago),
      sickThis: legacyReal(row.sick_this),
      sickTotal: legacyReal(row.sick_total),
      privacyAgo: legacyReal(row.privacy_ago),
      privacyThis: legacyReal(row.privacy_this),
      privacyTotal: legacyReal(row.privacy_total),
      birthAgo: legacyReal(row.birth_ago),
      birthThis: legacyReal(row.birth_this),
      birthTotal: legacyReal(row.birth_total),
      relaxAgo: legacyReal(row.relax_ago),
      relaxThis: legacyReal(row.relax_this),
      relaxTotal: legacyReal(row.relax_total),
      relaxCollect: legacyReal(row.relax_collect),
      relaxThisYear: legacyReal(row.relax_this_year),
      contact: row.contact ? String(row.contact) : null,
      contactTel: row.contact_tel ? String(row.contact_tel) : null,
      documentName: row.document ? String(row.document) : null,
      noComment: parseLegacyBool(row.no_comment),
      grantPersonSelected: legacyPersonId(row.grant_p_selected),
      jobPersonId: legacyPersonId(row.job_person),
      jobPersonSigned: parseLegacyBool(row.job_person_sign),
      officerComment: row.officer_comment ? String(row.officer_comment) : null,
      officerSignPersonId: legacyPersonId(row.officer_sign),
      officerDate: normalizeLegacyTimestamp(row.officer_date),
      groupComment: row.group_comment ? String(row.group_comment) : null,
      groupSignPersonId: legacyPersonId(row.group_sign),
      groupDate: normalizeLegacyTimestamp(row.group_date),
      groupComment2: row.group_comment2 ? String(row.group_comment2) : null,
      groupSign2PersonId: legacyPersonId(row.group_sign2),
      groupDate2: normalizeLegacyTimestamp(row.group_date2),
      commanderGrant: Number.isFinite(commanderGrant) ? commanderGrant : null,
      commanderComment: row.commander_comment
        ? String(row.commander_comment)
        : null,
      commanderSignPersonId: legacyPersonId(row.commander_sign),
      grantDate: normalizeLegacyTimestamp(row.grant_date),
      createdAt:
        normalizeLegacyTimestamp(row.rec_date) ?? new Date("1970-01-01"),
    },
  };
}

async function importLeaveYears(): Promise<number> {
  if (!(await legacyTableExists("la_year"))) return 0;

  const rows = await queryClient<
    Record<string, unknown>[]
  >`SELECT * FROM la_year ORDER BY budget_year`;
  let count = 0;

  for (const row of rows) {
    const budgetYear = Number(row.budget_year);
    if (!Number.isFinite(budgetYear)) continue;

    await db
      .insert(leaveYears)
      .values({
        budgetYear,
        yearActive: parseLegacyPermissionFlag(row.year_active) === 1,
      })
      .onConflictDoUpdate({
        target: leaveYears.budgetYear,
        set: {
          yearActive: parseLegacyPermissionFlag(row.year_active) === 1,
        },
      });
    count += 1;
  }

  return count;
}

async function importLeavePermissions(maps: ImportMaps): Promise<number> {
  if (!(await legacyTableExists("la_permission"))) return 0;

  const rows = await queryClient<
    Record<string, unknown>[]
  >`SELECT * FROM la_permission ORDER BY id`;
  const seenUsers = new Set<number>();
  let count = 0;

  for (const row of rows) {
    const personId = String(row.person_id ?? "");
    const userId = maps.userMap.get(personId);
    if (!userId || seenUsers.has(userId)) continue;
    seenUsers.add(userId);

    await db
      .insert(leavePermissions)
      .values({
        userId,
        p1: parseLegacyPermissionFlag(row.p1),
        p2: parseLegacyPermissionFlag(row.p2),
        officerPersonId: legacyPersonId(row.officer),
      })
      .onConflictDoUpdate({
        target: leavePermissions.userId,
        set: {
          p1: parseLegacyPermissionFlag(row.p1),
          p2: parseLegacyPermissionFlag(row.p2),
          officerPersonId: legacyPersonId(row.officer),
        },
      });
    count += 1;
  }

  return count;
}

async function importLeavePersonSettings(
  peopleIds: Set<string>,
): Promise<number> {
  if (!(await legacyTableExists("la_person_set"))) return 0;

  const rows = await queryClient<
    Record<string, unknown>[]
  >`SELECT * FROM la_person_set ORDER BY id`;
  let count = 0;

  for (const row of rows) {
    const personId = String(row.person_id ?? "");
    if (!peopleIds.has(personId)) continue;

    const commentPersonId = legacyPersonId(row.comment_person);
    const commentPerson2Id = legacyPersonId(row.comment_person2);

    await db
      .insert(leavePersonSettings)
      .values({
        personId,
        commentPersonId,
        commentPerson2Id,
        grantPersonId: legacyPersonId(row.grant_person),
        officerPersonId: legacyPersonId(row.officer),
      })
      .onConflictDoUpdate({
        target: leavePersonSettings.personId,
        set: {
          commentPersonId,
          commentPerson2Id,
          grantPersonId: legacyPersonId(row.grant_person),
          officerPersonId: legacyPersonId(row.officer),
        },
      });
    count += 1;
  }

  return count;
}

async function importLeaveCollect(peopleIds: Set<string>): Promise<number> {
  if (!(await legacyTableExists("la_collect"))) return 0;

  const rows = await queryClient<
    Record<string, unknown>[]
  >`SELECT * FROM la_collect ORDER BY id`;
  let count = 0;

  for (const row of rows) {
    const personId = String(row.person_id ?? "");
    if (!peopleIds.has(personId)) continue;

    const budgetYear = Number(row.year);
    if (!Number.isFinite(budgetYear)) continue;

    await db
      .insert(leaveCollect)
      .values({
        budgetYear,
        personId,
        collectDay: legacyReal(row.collect_day) ?? 0,
        thisYearDay: Number(row.this_year_day) || 0,
        officerPersonId: legacyPersonId(row.officer),
      })
      .onConflictDoUpdate({
        target: [leaveCollect.budgetYear, leaveCollect.personId],
        set: {
          collectDay: legacyReal(row.collect_day) ?? 0,
          thisYearDay: Number(row.this_year_day) || 0,
          officerPersonId: legacyPersonId(row.officer),
        },
      });
    count += 1;
  }

  return count;
}

async function importLeaveRequestsFromTable(
  table: string,
  maps: ImportMaps,
  peopleIds: Set<string>,
  existingKeys: Set<string>,
): Promise<{
  inserted: number;
  skippedExisting: number;
  skippedNoPerson: number;
}> {
  if (!(await legacyTableExists(table))) {
    return { inserted: 0, skippedExisting: 0, skippedNoPerson: 0 };
  }

  const rows = await queryClient.unsafe(
    `SELECT * FROM "${table}" ORDER BY la_start, id`,
  );

  let batch: (typeof leaveRequests.$inferInsert)[] = [];
  let inserted = 0;
  let skippedExisting = 0;
  let skippedNoPerson = 0;

  const flush = async () => {
    if (batch.length === 0) return;
    await db.insert(leaveRequests).values(batch);
    inserted += batch.length;
    batch = [];
  };

  for (const row of rows) {
    const mapped = mapLeaveRequestRow(row, maps, peopleIds);
    if (!mapped.row) {
      if (mapped.skipReason === "no_person") skippedNoPerson += 1;
      continue;
    }

    const key = leaveRequestDedupKey({
      personId: mapped.row.personId,
      leaveStart: mapped.row.leaveStart,
      leaveFinish: mapped.row.leaveFinish,
      leaveType: mapped.row.leaveType,
      leaveTotal: mapped.row.leaveTotal,
      commanderGrant: mapped.row.commanderGrant ?? null,
    });

    if (existingKeys.has(key)) {
      skippedExisting += 1;
      continue;
    }

    existingKeys.add(key);
    await flushBatch(batch, flush, mapped.row);
  }

  await flush();

  return { inserted, skippedExisting, skippedNoPerson };
}

async function syncAllQuotaBalances(budgetYear: number): Promise<number> {
  const personRows = await db
    .select({ personId: people.personId })
    .from(people);
  let count = 0;

  for (const { personId } of personRows) {
    for (const leaveType of QUOTA_TYPES) {
      await syncQuotaBalance(personId, budgetYear, leaveType);
      count += 1;
    }
  }

  return count;
}

function permissionPeriodKey(input: {
  personId: string;
  leaveType: number;
  permissionStart: string;
  permissionFinish: string;
  permissionTotal: number;
}): string {
  return [
    input.personId,
    input.leaveType,
    input.permissionStart,
    input.permissionFinish,
    input.permissionTotal,
  ].join("|");
}

async function loadApprovedSourceRequestMap(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      id: leaveRequests.id,
      personId: leaveRequests.personId,
      leaveType: leaveRequests.leaveType,
      leaveStart: leaveRequests.leaveStart,
      leaveFinish: leaveRequests.leaveFinish,
      leaveTotal: leaveRequests.leaveTotal,
    })
    .from(leaveRequests)
    .where(eq(leaveRequests.commanderGrant, 1));

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(
      permissionPeriodKey({
        personId: row.personId,
        leaveType: row.leaveType,
        permissionStart: row.leaveStart,
        permissionFinish: row.leaveFinish,
        permissionTotal: row.leaveTotal,
      }),
      row.id,
    );
  }
  return map;
}

async function loadExistingCancellationSourceIds(): Promise<Set<number>> {
  const rows = await db
    .select({ sourceRequestId: leaveCancellations.sourceRequestId })
    .from(leaveCancellations);
  return new Set(rows.map((r) => r.sourceRequestId));
}

function mapLeaveCancellationRow(
  row: Record<string, unknown>,
  peopleIds: Set<string>,
  sourceMap: Map<string, number>,
): {
  row: typeof leaveCancellations.$inferInsert | null;
  skipReason?: "no_person" | "no_source";
} {
  const personId = String(row.person_id ?? "");
  if (!peopleIds.has(personId)) {
    return { row: null, skipReason: "no_person" };
  }

  const permissionStart = normalizeLegacyDate(row.permission_start);
  const permissionFinish = normalizeLegacyDate(row.permission_finish);
  const cancelStart = normalizeLegacyDate(row.cancel_la_start);
  const cancelFinish = normalizeLegacyDate(row.cancel_la_finish);
  if (!permissionStart || !permissionFinish || !cancelStart || !cancelFinish) {
    return { row: null, skipReason: "no_source" };
  }

  const leaveType = Number(row.la_type ?? 0);
  const permissionTotal = Number(row.permission_total ?? 0);
  const sourceRequestId = sourceMap.get(
    permissionPeriodKey({
      personId,
      leaveType,
      permissionStart,
      permissionFinish,
      permissionTotal,
    }),
  );
  if (!sourceRequestId) {
    return { row: null, skipReason: "no_source" };
  }

  const because = String(row.because ?? "").trim();
  if (!because) {
    return { row: null, skipReason: "no_source" };
  }

  const commanderGrant =
    row.commander_grant == null || row.commander_grant === ""
      ? null
      : Number(row.commander_grant);

  return {
    row: {
      personId,
      sourceRequestId,
      leaveType,
      writeAt: row.write_at ? String(row.write_at) : null,
      permissionStart,
      permissionFinish,
      permissionTotal,
      because,
      cancelStart,
      cancelFinish,
      cancelTotal: Number(row.cancel_la_total ?? 0),
      noComment: parseLegacyBool(row.no_comment),
      grantPersonSelected: legacyPersonId(row.grant_p_selected),
      officerComment: row.officer_comment ? String(row.officer_comment) : null,
      officerSignPersonId: legacyPersonId(row.officer_sign),
      officerDate: normalizeLegacyTimestamp(row.officer_date),
      groupComment: row.group_comment ? String(row.group_comment) : null,
      groupSignPersonId: legacyPersonId(row.group_sign),
      groupDate: normalizeLegacyTimestamp(row.group_date),
      commanderGrant: Number.isFinite(commanderGrant) ? commanderGrant : null,
      commanderComment: row.commander_comment
        ? String(row.commander_comment)
        : null,
      commanderSignPersonId: legacyPersonId(row.commander_sign),
      grantDate: normalizeLegacyTimestamp(row.grant_date),
      createdAt:
        normalizeLegacyTimestamp(row.rec_date) ?? new Date("1970-01-01"),
    },
  };
}

async function importLeaveCancellationsFromTable(
  table: string,
  peopleIds: Set<string>,
  sourceMap: Map<string, number>,
  existingSourceIds: Set<number>,
): Promise<{
  inserted: number;
  skippedExisting: number;
  skippedNoSource: number;
  skippedNoPerson: number;
}> {
  if (!(await legacyTableExists(table))) {
    return {
      inserted: 0,
      skippedExisting: 0,
      skippedNoSource: 0,
      skippedNoPerson: 0,
    };
  }

  const rows = await queryClient.unsafe(
    `SELECT * FROM "${table}" ORDER BY rec_date, id`,
  );

  let batch: (typeof leaveCancellations.$inferInsert)[] = [];
  let inserted = 0;
  let skippedExisting = 0;
  let skippedNoSource = 0;
  let skippedNoPerson = 0;

  const flush = async () => {
    if (batch.length === 0) return;
    await db.insert(leaveCancellations).values(batch);
    inserted += batch.length;
    batch = [];
  };

  for (const row of rows) {
    const mapped = mapLeaveCancellationRow(row, peopleIds, sourceMap);
    if (!mapped.row) {
      if (mapped.skipReason === "no_person") skippedNoPerson += 1;
      else skippedNoSource += 1;
      continue;
    }

    if (existingSourceIds.has(mapped.row.sourceRequestId)) {
      skippedExisting += 1;
      continue;
    }

    existingSourceIds.add(mapped.row.sourceRequestId);
    await flushBatch(batch, flush, mapped.row);
  }

  await flush();

  return { inserted, skippedExisting, skippedNoSource, skippedNoPerson };
}

async function importLeaveCancellations(peopleIds: Set<string>): Promise<{
  inserted: number;
  skippedExisting: number;
  skippedNoSource: number;
  skippedNoPerson: number;
}> {
  const sourceMap = await loadApprovedSourceRequestMap();
  const existingSourceIds = await loadExistingCancellationSourceIds();

  const fromMain = await importLeaveCancellationsFromTable(
    "la_cancel",
    peopleIds,
    sourceMap,
    existingSourceIds,
  );
  const fromBk = await importLeaveCancellationsFromTable(
    "la_cancel_bk",
    peopleIds,
    sourceMap,
    existingSourceIds,
  );
  const fromBk01 = await importLeaveCancellationsFromTable(
    "la_cancel_bk01",
    peopleIds,
    sourceMap,
    existingSourceIds,
  );

  return {
    inserted: fromMain.inserted + fromBk.inserted + fromBk01.inserted,
    skippedExisting:
      fromMain.skippedExisting +
      fromBk.skippedExisting +
      fromBk01.skippedExisting,
    skippedNoSource:
      fromMain.skippedNoSource +
      fromBk.skippedNoSource +
      fromBk01.skippedNoSource,
    skippedNoPerson:
      fromMain.skippedNoPerson +
      fromBk.skippedNoPerson +
      fromBk01.skippedNoPerson,
  };
}

export async function importLeave(
  maps: ImportMaps,
  options: ImportLeaveOptions = {},
): Promise<ImportLeaveResult> {
  const peopleBackfill = options.skipPeopleBackfill
    ? { inserted: 0, skippedExisting: 0, namesRefreshed: 0 }
    : await ensureLeavePeopleFromLegacy(maps);

  const peopleIds = await loadPeopleIds();
  const existingKeys = await loadExistingRequestKeys();

  const years = await importLeaveYears();
  const permissions = await importLeavePermissions(maps);
  const personSettings = await importLeavePersonSettings(peopleIds);
  const collect = await importLeaveCollect(peopleIds);

  const fromMain = await importLeaveRequestsFromTable(
    "la_main",
    maps,
    peopleIds,
    existingKeys,
  );
  const fromBk = await importLeaveRequestsFromTable(
    "la_main_bk",
    maps,
    peopleIds,
    existingKeys,
  );

  const requestsInserted = fromMain.inserted + fromBk.inserted;
  const requestsSkippedExisting =
    fromMain.skippedExisting + fromBk.skippedExisting;
  const requestsSkippedNoPerson =
    fromMain.skippedNoPerson + fromBk.skippedNoPerson;

  const cancellationResult = await importLeaveCancellations(peopleIds);

  const [activeYear] = await db
    .select({ budgetYear: leaveYears.budgetYear })
    .from(leaveYears)
    .where(eq(leaveYears.yearActive, true))
    .limit(1);

  const budgetYear =
    activeYear?.budgetYear ??
    budgetYearFromIsoDate(new Date().toISOString().slice(0, 10));

  const quotaBalancesSynced = options.skipQuotaSync
    ? 0
    : await syncAllQuotaBalances(budgetYear);

  return {
    years,
    permissions,
    personSettings,
    collect,
    peopleBackfilled: peopleBackfill.inserted,
    peopleBackfillSkippedExisting: peopleBackfill.skippedExisting,
    peopleNamesRefreshed: peopleBackfill.namesRefreshed,
    requestsInserted,
    requestsSkippedExisting,
    requestsSkippedNoPerson,
    cancellationsInserted: cancellationResult.inserted,
    cancellationsSkippedExisting: cancellationResult.skippedExisting,
    cancellationsSkippedNoSource: cancellationResult.skippedNoSource,
    cancellationsSkippedNoPerson: cancellationResult.skippedNoPerson,
    quotaBalancesSynced,
  };
}
