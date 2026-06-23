import { sql } from "drizzle-orm";
import { db, queryClient } from "../../src/lib/db";
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
  try {
    await db.execute(sql`SET session_replication_role = 'replica'`);
  } catch {
    /* non-superuser local dev */
  }

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
    await db.execute(
      sql.raw(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`),
    );
  }

  try {
    await db.execute(sql`SET session_replication_role = 'origin'`);
  } catch {
    /* ignore */
  }
}

export async function countLegacyLeaveRows(): Promise<{
  laMain: number;
  laMainBk: number;
  laCancel: number;
  laCancelBk: number;
  laCancelBk01: number;
}> {
  const countIfExists = async (table: string) => {
    const exists = await queryClient<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = ${table}
      ) AS exists
    `;
    if (!exists[0]?.exists) return 0;
    const result = await queryClient.unsafe(
      `SELECT COUNT(*)::text AS count FROM "${table}"`,
    );
    return Number((result[0] as { count: string })?.count ?? 0);
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
  const [req, approved, cancel, peopleRows] = await Promise.all([
    queryClient<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM leave_requests
    `,
    queryClient<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM leave_requests WHERE commander_grant = 1
    `,
    queryClient<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM leave_cancellations
    `,
    queryClient<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM people
    `,
  ]);

  return {
    leaveRequests: Number(req[0]?.count ?? 0),
    leaveRequestsApproved: Number(approved[0]?.count ?? 0),
    leaveCancellations: Number(cancel[0]?.count ?? 0),
    people: Number(peopleRows[0]?.count ?? 0),
  };
}
