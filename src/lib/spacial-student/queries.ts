import {
  and,
  asc,
  count,
  eq,
  ilike,
  isNull,
  notInArray,
  or,
  type SQL,
} from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { classLevelLabel } from "@/lib/student-main/constants";
import { disableTypeLabel } from "@/lib/spacial-student/constants";
import type { SpacialStudentScope } from "@/lib/spacial-student/scope";
import { db } from "@/lib/db";
import {
  people,
  schools,
  spacialStudentDisabled,
  spacialStudentPermissions,
  students,
  users,
} from "@/lib/db/schema";

export const PAGE_SIZE = 25;

export type SpacialStudentListRow = {
  id: number;
  personId: string;
  studentId: string | null;
  displayName: string;
  schoolCode: string;
  schoolName: string | null;
  disableType: number;
  disableTypeLabel: string;
  classLevelLabel: string | null;
  status: number;
  recDate: string;
};

export type SpacialStudentDetail = {
  id: number;
  personId: string;
  schoolCode: string;
  schoolName: string | null;
  disableType: number;
  disableDetail: string;
  other: string;
  pic: string;
  status: number;
  recDate: string;
  studentId: string | null;
  displayName: string | null;
  classLevelLabel: string | null;
};

export type SpacialStudentPermissionRow = {
  id: number;
  userId: number;
  personId: string;
  p1: number;
  p2: number;
  p3: number;
  officerPersonId: string | null;
  displayName: string;
};

export type DistrictStaffOption = {
  userId: number;
  personId: string;
  label: string;
};

function scopeCondition(scope: SpacialStudentScope): SQL | undefined {
  if (scope.kind === "district") return undefined;
  return eq(spacialStudentDisabled.schoolCode, scope.schoolCode);
}

function buildWhere(
  scope: SpacialStudentScope,
  q: string,
  schoolCode: string | null,
  disableType: number | null,
) {
  const conditions: (SQL | undefined)[] = [scopeCondition(scope)];

  if (schoolCode) {
    conditions.push(eq(spacialStudentDisabled.schoolCode, schoolCode));
  }
  if (disableType) {
    conditions.push(eq(spacialStudentDisabled.disableType, disableType));
  }

  if (q.length >= 2) {
    conditions.push(
      or(
        ilike(spacialStudentDisabled.personId, `%${q}%`),
        ilike(students.studentId, `%${q}%`),
        ilike(students.name, `%${q}%`),
        ilike(students.surname, `%${q}%`),
      ),
    );
  }

  const filtered = conditions.filter(Boolean) as SQL[];
  return filtered.length > 0 ? and(...filtered) : undefined;
}

export function parseSpacialStudentListParams(params: {
  page?: string;
  q?: string;
  schoolCode?: string;
  disableType?: string;
}) {
  const page = Math.max(1, Number(params.page) || 1);
  const q = (params.q ?? "").trim();
  const schoolCode = (params.schoolCode ?? "").trim() || null;
  const disableTypeRaw = Number(params.disableType);
  const disableType =
    Number.isFinite(disableTypeRaw) &&
    disableTypeRaw >= 1 &&
    disableTypeRaw <= 9
      ? disableTypeRaw
      : null;
  return { page, q, schoolCode, disableType };
}

export async function resolveSpacialStudentListPage(
  total: number,
  page: number,
): Promise<number> {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Math.min(page, totalPages);
}

export async function countSpacialStudents(
  scope: SpacialStudentScope,
  q: string,
  schoolCode: string | null,
  disableType: number | null,
): Promise<number> {
  const where = buildWhere(scope, q, schoolCode, disableType);
  const query = db
    .select({ total: count() })
    .from(spacialStudentDisabled)
    .leftJoin(students, eq(students.personId, spacialStudentDisabled.personId));

  const [row] = where ? await query.where(where) : await query;
  return Number(row?.total ?? 0);
}

export async function listSpacialStudentsPage(input: {
  scope: SpacialStudentScope;
  page: number;
  q: string;
  schoolCode: string | null;
  disableType: number | null;
}): Promise<SpacialStudentListRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const where = buildWhere(
    input.scope,
    input.q,
    input.schoolCode,
    input.disableType,
  );

  const base = db
    .select({
      id: spacialStudentDisabled.id,
      personId: spacialStudentDisabled.personId,
      schoolCode: spacialStudentDisabled.schoolCode,
      schoolName: schools.name,
      disableType: spacialStudentDisabled.disableType,
      status: spacialStudentDisabled.status,
      recDate: spacialStudentDisabled.recDate,
      studentId: students.studentId,
      prename: students.prename,
      name: students.name,
      surname: students.surname,
      classLevel: students.classLevel,
    })
    .from(spacialStudentDisabled)
    .leftJoin(schools, eq(schools.schoolCode, spacialStudentDisabled.schoolCode))
    .leftJoin(students, eq(students.personId, spacialStudentDisabled.personId))
    .orderBy(asc(spacialStudentDisabled.schoolCode), asc(students.classLevel))
    .limit(PAGE_SIZE)
    .offset(offset);

  const rows = where ? await base.where(where) : await base;

  return rows.map((row) => ({
    id: row.id,
    personId: row.personId,
    studentId: row.studentId,
    displayName: row.name
      ? `${row.prename ?? ""}${row.name} ${row.surname ?? ""}`.trim()
      : row.personId,
    schoolCode: row.schoolCode,
    schoolName: row.schoolName,
    disableType: row.disableType,
    disableTypeLabel: disableTypeLabel(row.disableType),
    classLevelLabel: row.classLevel ? classLevelLabel(row.classLevel) : null,
    status: row.status,
    recDate: row.recDate,
  }));
}

export async function getSpacialStudent(
  id: number,
): Promise<SpacialStudentDetail | null> {
  const [row] = await db
    .select({
      id: spacialStudentDisabled.id,
      personId: spacialStudentDisabled.personId,
      schoolCode: spacialStudentDisabled.schoolCode,
      schoolName: schools.name,
      disableType: spacialStudentDisabled.disableType,
      disableDetail: spacialStudentDisabled.disableDetail,
      other: spacialStudentDisabled.other,
      pic: spacialStudentDisabled.pic,
      status: spacialStudentDisabled.status,
      recDate: spacialStudentDisabled.recDate,
      studentId: students.studentId,
      prename: students.prename,
      name: students.name,
      surname: students.surname,
      classLevel: students.classLevel,
    })
    .from(spacialStudentDisabled)
    .leftJoin(schools, eq(schools.schoolCode, spacialStudentDisabled.schoolCode))
    .leftJoin(students, eq(students.personId, spacialStudentDisabled.personId))
    .where(eq(spacialStudentDisabled.id, id))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    personId: row.personId,
    schoolCode: row.schoolCode,
    schoolName: row.schoolName,
    disableType: row.disableType,
    disableDetail: row.disableDetail,
    other: row.other,
    pic: row.pic,
    status: row.status,
    recDate: row.recDate,
    studentId: row.studentId,
    displayName: row.name
      ? `${row.prename ?? ""}${row.name} ${row.surname ?? ""}`.trim()
      : null,
    classLevelLabel: row.classLevel ? classLevelLabel(row.classLevel) : null,
  };
}

export function canViewSpacialStudent(
  record: SpacialStudentDetail,
  scope: SpacialStudentScope,
): boolean {
  if (scope.kind === "district") return true;
  return record.schoolCode === scope.schoolCode;
}

export async function listSchoolsForSpacialFilter() {
  return db
    .select({
      schoolCode: schools.schoolCode,
      name: schools.name,
    })
    .from(schools)
    .orderBy(asc(schools.name));
}

export async function listSpacialStudentPermissions(): Promise<
  SpacialStudentPermissionRow[]
> {
  const rows = await db
    .select({
      id: spacialStudentPermissions.id,
      userId: spacialStudentPermissions.userId,
      personId: users.personId,
      p1: spacialStudentPermissions.p1,
      p2: spacialStudentPermissions.p2,
      p3: spacialStudentPermissions.p3,
      officerPersonId: spacialStudentPermissions.officerPersonId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(spacialStudentPermissions)
    .innerJoin(users, eq(spacialStudentPermissions.userId, users.id))
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
        eq(users.organizationType, "district"),
        isNull(spacialStudentPermissions.schoolId),
      ),
    )
    .orderBy(asc(spacialStudentPermissions.id));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    personId: row.personId,
    p1: row.p1,
    p2: row.p2,
    p3: row.p3,
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

export async function getSpacialStudentModulePermission(id: number) {
  const rows = await listSpacialStudentPermissions();
  return rows.find((r) => r.id === id) ?? null;
}

export async function listDistrictStaffForSpacialPicker(
  excludeUserId?: number,
): Promise<DistrictStaffOption[]> {
  const existing = await db
    .select({ userId: spacialStudentPermissions.userId })
    .from(spacialStudentPermissions)
    .where(isNull(spacialStudentPermissions.schoolId));

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

export async function getSpacialStudentPermissionByUserId(userId: number) {
  const [row] = await db
    .select()
    .from(spacialStudentPermissions)
    .where(
      and(
        eq(spacialStudentPermissions.userId, userId),
        isNull(spacialStudentPermissions.schoolId),
      ),
    )
    .limit(1);
  return row ?? null;
}
