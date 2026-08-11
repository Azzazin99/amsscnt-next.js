import { and, asc, eq, gt, ne, notInArray, or } from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { db } from "@/lib/db";
import { bookPermissions, people, schools, users, workgroups } from "@/lib/db/schema";

export type BookPermissionRow = {
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
  workgroupName?: string | null;
};

export type SchoolSarabanPermissionRow = BookPermissionRow & {
  schoolId: number | null;
  schoolCode: string | null;
  schoolName: string | null;
};

export async function listBookPermissions(): Promise<BookPermissionRow[]> {
  const rows = await db
    .select({
      id: bookPermissions.id,
      userId: bookPermissions.userId,
      personId: users.personId,
      p1: bookPermissions.p1,
      p2: bookPermissions.p2,
      p3: bookPermissions.p3,
      canViewSecret: bookPermissions.canViewSecret,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
      workgroupName: workgroups.name,
    })
    .from(bookPermissions)
    .innerJoin(users, eq(bookPermissions.userId, users.id))
    .leftJoin(workgroups, eq(bookPermissions.p2, workgroups.id))
    .leftJoin(
      people,
      and(
        eq(people.personId, users.personId),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .where(eq(users.organizationType, "district"))
    .orderBy(asc(bookPermissions.id));

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
    workgroupName: row.workgroupName,
  }));
}

export async function listSarabanPermissions(): Promise<BookPermissionRow[]> {
  const rows = await listBookPermissions();
  return rows.filter((r) => r.p1 === 1 || r.p2 > 0);
}

export async function getBookPermission(id: number) {
  const rows = await listBookPermissions();
  return rows.find((r) => r.id === id) ?? null;
}

export async function listSchoolSarabanPermissions(
  filterSchoolId?: number,
): Promise<SchoolSarabanPermissionRow[]> {
  const conditions = [gt(bookPermissions.p3, 1)];

  if (filterSchoolId) {
    conditions.push(eq(users.schoolId, filterSchoolId));
  }

  const rows = await db
    .select({
      id: bookPermissions.id,
      userId: bookPermissions.userId,
      personId: users.personId,
      p1: bookPermissions.p1,
      p2: bookPermissions.p2,
      p3: bookPermissions.p3,
      canViewSecret: bookPermissions.canViewSecret,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
      schoolId: users.schoolId,
      schoolCode: schools.schoolCode,
      schoolName: schools.name,
    })
    .from(bookPermissions)
    .innerJoin(users, eq(bookPermissions.userId, users.id))
    .leftJoin(schools, eq(users.schoolId, schools.id))
    .leftJoin(
      people,
      and(
        eq(people.personId, users.personId),
        eq(people.organizationType, "school"),
        eq(people.status, 0),
      ),
    )
    .where(and(...conditions))
    .orderBy(asc(schools.name), asc(bookPermissions.id));

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
    schoolId: row.schoolId,
    schoolCode: row.schoolCode,
    schoolName: row.schoolName,
  }));
}

export type SchoolOption = {
  id: number;
  schoolCode: string;
  name: string;
};

export async function listSchoolsForPicker(): Promise<SchoolOption[]> {
  const rows = await db
    .select({
      id: schools.id,
      schoolCode: schools.schoolCode,
      name: schools.name,
    })
    .from(schools)
    .orderBy(asc(schools.name));

  return rows;
}

export type DistrictStaffOption = {
  userId: number;
  personId: string;
  label: string;
  workgroupId?: number | null;
};

export async function listDistrictStaffForBookPicker(
  excludeUserId?: number,
): Promise<DistrictStaffOption[]> {
  const conditions = [
    eq(users.organizationType, "district"),
    eq(users.status, 1),
    eq(people.organizationType, "district"),
    eq(people.status, 0),
  ];

  if (excludeUserId) {
    conditions.push(ne(users.id, excludeUserId));
  }

  const rows = await db
    .select({
      userId: users.id,
      personId: users.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
      workgroupId: people.workgroupId,
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
      workgroupId: row.workgroupId,
    };
  });
}

export async function listSchoolStaffForBookPicker(
  schoolId: number,
  excludeUserId?: number,
): Promise<DistrictStaffOption[]> {
  const existingWithP3 = await db
    .select({ userId: bookPermissions.userId })
    .from(bookPermissions)
    .where(gt(bookPermissions.p3, 0));

  const existingIds = existingWithP3
    .map((r) => r.userId)
    .filter((id) => id !== excludeUserId);

  const conditions = [
    eq(users.organizationType, "school"),
    eq(users.schoolId, schoolId),
    eq(users.status, 1),
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
    .leftJoin(
      people,
      and(
        eq(people.personId, users.personId),
        eq(people.organizationType, "school"),
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

export type WorkgroupOption = {
  id: number;
  name: string;
};

export async function listWorkgroupsForPicker(): Promise<WorkgroupOption[]> {
  const rows = await db
    .select({
      id: workgroups.id,
      name: workgroups.name,
    })
    .from(workgroups)
    .orderBy(asc(workgroups.sortOrder), asc(workgroups.name));

  return rows;
}
