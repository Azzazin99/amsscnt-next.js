import { and, asc, eq, notInArray } from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { db } from "@/lib/db";
import { people, registerPermissions, users } from "@/lib/db/schema";

export type DistrictPermissionRow = {
  id: number;
  userId: number;
  personId: string;
  p1: number;
  p2: number;
  p3: number;
  canViewSecret: boolean;
  prefix: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
};

export async function listDistrictRegisterPermissions(): Promise<
  DistrictPermissionRow[]
> {
  const rows = await db
    .select({
      id: registerPermissions.id,
      userId: registerPermissions.userId,
      personId: users.personId,
      p1: registerPermissions.p1,
      p2: registerPermissions.p2,
      p3: registerPermissions.p3,
      canViewSecret: registerPermissions.canViewSecret,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(registerPermissions)
    .innerJoin(users, eq(registerPermissions.userId, users.id))
    .leftJoin(
      people,
      and(
        eq(people.personId, users.personId),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .where(eq(users.organizationType, "district"))
    .orderBy(asc(registerPermissions.id));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    personId: row.personId,
    p1: row.p1,
    p2: row.p2,
    p3: row.p3,
    canViewSecret: row.canViewSecret,
    prefix: row.prefix,
    firstName: row.firstName,
    lastName: row.lastName,
    displayName: formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      fallback: row.userName,
    }),
  }));
}

export async function getDistrictRegisterPermission(id: number) {
  const rows = await listDistrictRegisterPermissions();
  return rows.find((r) => r.id === id) ?? null;
}

export type DistrictStaffOption = {
  userId: number;
  personId: string;
  label: string;
};

export async function listDistrictStaffForPicker(
  excludeUserId?: number,
): Promise<DistrictStaffOption[]> {
  const existing = await db
    .select({ userId: registerPermissions.userId })
    .from(registerPermissions);

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

  return rows.map((row) => {
    const name = formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      fallback: row.userName,
    });
    return {
      userId: row.userId,
      personId: row.personId,
      label: name,
    };
  });
}

export async function getDistrictPermissionByUserId(userId: number) {
  const [row] = await db
    .select()
    .from(registerPermissions)
    .where(eq(registerPermissions.userId, userId))
    .limit(1);
  return row ?? null;
}
