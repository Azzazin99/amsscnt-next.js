import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { db } from "@/lib/db";
import { leavePermissions, people, users } from "@/lib/db/schema";

export type SchoolGrantDeputyRow = {
  id: number;
  userId: number;
  personId: string;
  displayName: string;
  officerPersonId: string | null;
};

export async function listSchoolGrantDeputies(): Promise<SchoolGrantDeputyRow[]> {
  const rows = await db
    .select({
      id: leavePermissions.id,
      userId: leavePermissions.userId,
      personId: users.personId,
      officerPersonId: leavePermissions.officerPersonId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(leavePermissions)
    .innerJoin(users, eq(leavePermissions.userId, users.id))
    .leftJoin(
      people,
      and(
        eq(people.personId, users.personId),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .where(
      and(
        eq(leavePermissions.p1, 0),
        eq(leavePermissions.p2, 1),
        eq(users.organizationType, "district"),
      ),
    )
    .orderBy(asc(leavePermissions.id));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    personId: row.personId,
    officerPersonId: row.officerPersonId,
    displayName:
      formatPersonName({
        prefix: row.prefix,
        firstName: row.firstName,
        lastName: row.lastName,
        fallback: row.userName,
      }) || row.userName,
  }));
}

export async function getSchoolGrantDeputy(id: number) {
  const rows = await listSchoolGrantDeputies();
  return rows.find((r) => r.id === id) ?? null;
}

export type DeputyStaffOption = {
  userId: number;
  personId: string;
  label: string;
};

export async function listDeputyStaffForSchoolGrantPicker(
  excludeUserId?: number,
): Promise<DeputyStaffOption[]> {
  const existing = await db
    .select({ userId: leavePermissions.userId })
    .from(leavePermissions)
    .where(and(eq(leavePermissions.p1, 0), eq(leavePermissions.p2, 1)));

  const existingIds = existing
    .map((r) => r.userId)
    .filter((id) => id !== excludeUserId);

  const conditions = [
    eq(users.organizationType, "district"),
    eq(users.status, 1),
    eq(people.organizationType, "district"),
    eq(people.status, 0),
    eq(people.positionCode, 2),
  ];

  const rows = await db
    .select({
      userId: users.id,
      personId: users.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(users)
    .innerJoin(
      people,
      and(
        eq(people.personId, users.personId),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
        eq(people.positionCode, 2),
      ),
    )
    .where(and(...conditions))
    .orderBy(asc(people.firstName), asc(people.lastName));

  return rows
    .filter((row) => !existingIds.includes(row.userId))
    .map((row) => ({
      userId: row.userId,
      personId: row.personId,
      label:
        formatPersonName({
          prefix: row.prefix,
          firstName: row.firstName,
          lastName: row.lastName,
          fallback: row.userName,
        }) || row.userName,
    }));
}

export async function assertDeputyDistrictUser(userId: number) {
  const [row] = await db
    .select({
      organizationType: users.organizationType,
      positionCode: people.positionCode,
    })
    .from(users)
    .innerJoin(people, eq(people.personId, users.personId))
    .where(and(eq(users.id, userId), eq(users.status, 1)))
    .limit(1);

  return Boolean(
    row &&
      row.organizationType === "district" &&
      row.positionCode === 2,
  );
}
