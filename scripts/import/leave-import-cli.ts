import { sql } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { schools, users } from "../../src/lib/db/schema";
import type { ImportMaps } from "./shared";

export async function buildLeaveImportMapsFromDb(): Promise<ImportMaps> {
  const schoolRows = await db
    .select({ id: schools.id, schoolCode: schools.schoolCode })
    .from(schools);
  const userRows = await db
    .select({ id: users.id, personId: users.personId })
    .from(users);

  return {
    workgroupMap: new Map(),
    schoolMap: new Map(schoolRows.map((s) => [s.schoolCode, s.id])),
    userMap: new Map(userRows.map((u) => [u.personId, u.id])),
  };
}

export async function truncateLeaveTables() {
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

  const tables = [
    "leave_cancellations",
    "leave_request_files",
    "leave_requests",
    "leave_quota_balances",
    "leave_person_settings",
    "leave_permissions",
    "leave_years",
  ];

  for (const table of tables) {
    try {
      await db.execute(sql.raw(`TRUNCATE TABLE \`${table}\``));
    } catch {
      /* ignore if table not found */
    }
  }

  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
}

export async function countLegacyLeaveRows(): Promise<{
  laMain: number;
  laMainBk: number;
  laCancel: number;
  laCancelBk: number;
  laCancelBk01: number;
}> {
  const countIfExists = async (table: string) => {
    try {
      const result = (await db.execute(
        sql.raw(`SELECT COUNT(*) AS count FROM \`${table}\``),
      )) as unknown as [Record<string, unknown>[]];
      const rows = (result[0] ?? []) as Record<string, unknown>[];
      return Number(rows[0]?.count ?? 0);
    } catch {
      return 0;
    }
  };

  const [laMain, laMainBk, laCancel, laCancelBk, laCancelBk01] =
    await Promise.all([
      countIfExists("la_main"),
      countIfExists("la_main_bk"),
      countIfExists("la_cancel"),
      countIfExists("la_cancel_bk"),
      countIfExists("la_cancel_bk01"),
    ]);

  return { laMain, laMainBk, laCancel, laCancelBk, laCancelBk01 };
}

export async function countLeaveAppRows(): Promise<{
  leaveRequests: number;
  leaveRequestsApproved: number;
  leaveCancellations: number;
  people: number;
}> {
  const countTable = async (queryStr: string) => {
    try {
      const res = (await db.execute(sql.raw(queryStr))) as unknown as [
        Record<string, unknown>[],
      ];
      const rows = (res[0] ?? []) as Record<string, unknown>[];
      return Number(rows[0]?.count ?? 0);
    } catch {
      return 0;
    }
  };

  const [leaveRequests, leaveRequestsApproved, leaveCancellations, people] =
    await Promise.all([
      countTable("SELECT COUNT(*) AS count FROM `leave_requests`"),
      countTable(
        "SELECT COUNT(*) AS count FROM `leave_requests` WHERE `commander_grant` = 1",
      ),
      countTable("SELECT COUNT(*) AS count FROM `leave_cancellations`"),
      countTable("SELECT COUNT(*) AS count FROM `people`"),
    ]);

  return {
    leaveRequests,
    leaveRequestsApproved,
    leaveCancellations,
    people,
  };
}
