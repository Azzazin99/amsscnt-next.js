import { and, asc, eq, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { people, personPermissions, users } from "@/lib/db/schema";
import { formatPersonName } from "@/lib/auth/format-name";

export type PersonPermissionRow = {
  id: number;
  userId: number;
  personId: string;
  p1: number;
  p2: number;
  p3: number;
  prefix: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
};

export async function listPersonModulePermissions(): Promise<PersonPermissionRow[]> {
  const rows = await db
    .select({
      id: personPermissions.id,
      userId: personPermissions.userId,
      personId: users.personId,
      p1: personPermissions.p1,
      p2: personPermissions.p2,
      p3: personPermissions.p3,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(personPermissions)
    .innerJoin(users, eq(personPermissions.userId, users.id))
    .leftJoin(
      people,
      and(
        eq(people.personId, users.personId),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .where(eq(users.organizationType, "district"))
    .orderBy(asc(personPermissions.id));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    personId: row.personId,
    p1: row.p1,
    p2: row.p2,
    p3: row.p3,
    prefix: row.prefix,
    firstName: row.firstName,
    lastName: row.lastName,
    displayName:
      formatPersonName({
        prefix: row.prefix,
        firstName: row.firstName,
        lastName: row.lastName,
        fallback: row.userName,
      }) || row.userName,
  }));
}

export async function getPersonModulePermission(id: number) {
  const rows = await listPersonModulePermissions();
  return rows.find((r) => r.id === id) ?? null;
}

export type DistrictStaffOption = {
  userId: number;
  personId: string;
  label: string;
};

export async function listDistrictStaffForPersonPicker(
  excludeUserId?: number,
): Promise<DistrictStaffOption[]> {
  const existing = await db
    .select({ userId: personPermissions.userId })
    .from(personPermissions);

  const existingIds = existing
    .map((r) => r.userId)
    .filter((id) => id !== excludeUserId);

  const conditions = [
    eq(users.organizationType, "district"),
    eq(users.status, 1),
    eq(people.organizationType, "district"),
    eq(people.status, 0),
  ];

  if (existingIds.length > 0) {
    conditions.push(notInArray(users.id, existingIds));
  }

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
      ),
    )
    .where(and(...conditions))
    .orderBy(asc(people.firstName), asc(people.lastName));

  return rows.map((row) => ({
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

export async function getPersonPermissionByUserId(userId: number) {
  const [row] = await db
    .select()
    .from(personPermissions)
    .where(eq(personPermissions.userId, userId))
    .limit(1);
  return row ?? null;
}
