import { and, asc, eq, notInArray } from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { db } from "@/lib/db";
import { bookobecPermissions, people, users } from "@/lib/db/schema";

export type BookobecPermissionRow = {
  id: number;
  userId: number;
  personId: string;
  p1: number;
  p2: number;
  officerPersonId: string | null;
  displayName: string;
};

export async function listBookobecPermissions(): Promise<BookobecPermissionRow[]> {
  const rows = await db
    .select({
      id: bookobecPermissions.id,
      userId: bookobecPermissions.userId,
      personId: users.personId,
      p1: bookobecPermissions.p1,
      p2: bookobecPermissions.p2,
      officerPersonId: bookobecPermissions.officerPersonId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(bookobecPermissions)
    .innerJoin(users, eq(bookobecPermissions.userId, users.id))
    .leftJoin(
      people,
      and(
        eq(people.personId, users.personId),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .where(eq(users.organizationType, "district"))
    .orderBy(asc(bookobecPermissions.id));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    personId: row.personId,
    p1: row.p1,
    p2: row.p2,
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

export async function getBookobecModulePermission(id: number) {
  const rows = await listBookobecPermissions();
  return rows.find((r) => r.id === id) ?? null;
}

export async function getBookobecPermissionByUserId(userId: number) {
  const [row] = await db
    .select()
    .from(bookobecPermissions)
    .where(eq(bookobecPermissions.userId, userId))
    .limit(1);
  return row ?? null;
}

export type DistrictStaffOption = {
  userId: number;
  personId: string;
  label: string;
};

export async function listDistrictStaffForBookobecPicker(
  excludeUserId?: number,
): Promise<DistrictStaffOption[]> {
  const existing = await db
    .select({ userId: bookobecPermissions.userId })
    .from(bookobecPermissions);

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
