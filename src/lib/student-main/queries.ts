import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
  notInArray,
  or,
  type SQL,
} from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { classLevelLabel, sexLabel } from "@/lib/student-main/constants";
import type { StudentScope } from "@/lib/student-main/scope";
import { db } from "@/lib/db";
import {
  people,
  schools,
  studentEdYears,
  studentPermissions,
  students,
  users,
} from "@/lib/db/schema";

export const PAGE_SIZE = 25;

export type StudentListRow = {
  id: number;
  studentId: string;
  personId: string;
  displayName: string;
  sex: string;
  sexLabel: string;
  classLevel: number;
  classLevelLabel: string;
  classroom: number;
  schoolCode: string;
  schoolName: string;
  edYear: number;
};

export type StudentDetail = StudentListRow & {
  prename: string;
  name: string;
  surname: string;
  refId: string;
  disable: number;
  status: number;
  recDate: string;
};

export type StudentEdYearRow = {
  id: number;
  edYear: number;
  yearActive: boolean;
};

export type StudentPermissionRow = {
  id: number;
  userId: number;
  personId: string;
  p1: number;
  p2: number;
  officerPersonId: string | null;
  displayName: string;
};

export type DistrictStaffOption = {
  userId: number;
  personId: string;
  label: string;
};

function scopeCondition(scope: StudentScope): SQL | undefined {
  if (scope.kind === "district") return undefined;
  return eq(students.schoolCode, scope.schoolCode);
}

function buildWhere(
  scope: StudentScope,
  q: string,
  edYear: number | null,
  schoolCode: string | null,
  classLevel: number | null,
) {
  const conditions: (SQL | undefined)[] = [scopeCondition(scope)];

  if (edYear) conditions.push(eq(students.edYear, edYear));
  if (schoolCode) conditions.push(eq(students.schoolCode, schoolCode));
  if (classLevel) conditions.push(eq(students.classLevel, classLevel));

  if (q.length >= 2) {
    conditions.push(
      or(
        ilike(students.studentId, `%${q}%`),
        ilike(students.personId, `%${q}%`),
        ilike(students.name, `%${q}%`),
        ilike(students.surname, `%${q}%`),
        ilike(students.prename, `%${q}%`),
      ),
    );
  }

  const filtered = conditions.filter(Boolean) as SQL[];
  return filtered.length > 0 ? and(...filtered) : undefined;
}

export function parseStudentListParams(params: {
  page?: string;
  q?: string;
  edYear?: string;
  schoolCode?: string;
  classLevel?: string;
}) {
  const page = Math.max(1, Number(params.page) || 1);
  const q = (params.q ?? "").trim();
  const edYearRaw = Number(params.edYear);
  const edYear =
    Number.isFinite(edYearRaw) && edYearRaw >= 2500 ? edYearRaw : null;
  const schoolCode = (params.schoolCode ?? "").trim() || null;
  const classLevelRaw = Number(params.classLevel);
  const classLevel =
    Number.isFinite(classLevelRaw) && classLevelRaw >= 1 && classLevelRaw <= 15
      ? classLevelRaw
      : null;
  return { page, q, edYear, schoolCode, classLevel };
}

export async function resolveStudentListPage(
  total: number,
  page: number,
): Promise<number> {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Math.min(page, totalPages);
}

export async function getActiveStudentEdYear() {
  const [row] = await db
    .select()
    .from(studentEdYears)
    .where(eq(studentEdYears.yearActive, true))
    .limit(1);
  return row ?? null;
}

export async function countStudents(
  scope: StudentScope,
  q: string,
  edYear: number | null,
  schoolCode: string | null,
  classLevel: number | null,
): Promise<number> {
  const where = buildWhere(scope, q, edYear, schoolCode, classLevel);
  const query = db.select({ total: count() }).from(students);
  const [row] = where ? await query.where(where) : await query;
  return Number(row?.total ?? 0);
}

export async function listStudentsPage(input: {
  scope: StudentScope;
  page: number;
  q: string;
  edYear: number | null;
  schoolCode: string | null;
  classLevel: number | null;
}): Promise<StudentListRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const where = buildWhere(
    input.scope,
    input.q,
    input.edYear,
    input.schoolCode,
    input.classLevel,
  );

  const base = db
    .select({
      id: students.id,
      studentId: students.studentId,
      personId: students.personId,
      prename: students.prename,
      name: students.name,
      surname: students.surname,
      sex: students.sex,
      classLevel: students.classLevel,
      classroom: students.classroom,
      schoolCode: students.schoolCode,
      schoolName: students.schoolName,
      edYear: students.edYear,
    })
    .from(students)
    .orderBy(
      asc(students.classLevel),
      asc(students.classroom),
      asc(students.studentId),
    )
    .limit(PAGE_SIZE)
    .offset(offset);

  const rows = where ? await base.where(where) : await base;

  return rows.map((row) => ({
    id: row.id,
    studentId: row.studentId,
    personId: row.personId,
    displayName: `${row.prename}${row.name} ${row.surname}`.trim(),
    sex: row.sex,
    sexLabel: sexLabel(row.sex),
    classLevel: row.classLevel,
    classLevelLabel: classLevelLabel(row.classLevel),
    classroom: row.classroom,
    schoolCode: row.schoolCode,
    schoolName: row.schoolName,
    edYear: row.edYear,
  }));
}

export async function getStudent(id: number): Promise<StudentDetail | null> {
  const [row] = await db
    .select()
    .from(students)
    .where(eq(students.id, id))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    studentId: row.studentId,
    personId: row.personId,
    prename: row.prename,
    name: row.name,
    surname: row.surname,
    displayName: `${row.prename}${row.name} ${row.surname}`.trim(),
    sex: row.sex,
    sexLabel: sexLabel(row.sex),
    classLevel: row.classLevel,
    classLevelLabel: classLevelLabel(row.classLevel),
    classroom: row.classroom,
    schoolCode: row.schoolCode,
    schoolName: row.schoolName,
    edYear: row.edYear,
    refId: row.refId,
    disable: row.disable,
    status: row.status,
    recDate: row.recDate,
  };
}

export function canViewStudent(
  student: StudentDetail,
  scope: StudentScope,
): boolean {
  if (scope.kind === "district") return true;
  return student.schoolCode === scope.schoolCode;
}

export async function listStudentEdYears(): Promise<StudentEdYearRow[]> {
  return db
    .select({
      id: studentEdYears.id,
      edYear: studentEdYears.edYear,
      yearActive: studentEdYears.yearActive,
    })
    .from(studentEdYears)
    .orderBy(asc(studentEdYears.edYear));
}

export async function getStudentEdYear(id: number) {
  const [row] = await db
    .select()
    .from(studentEdYears)
    .where(eq(studentEdYears.id, id))
    .limit(1);
  return row ?? null;
}

export async function listSchoolsForStudentFilter() {
  return db
    .select({
      schoolCode: schools.schoolCode,
      name: schools.name,
    })
    .from(schools)
    .orderBy(asc(schools.name));
}

export async function listStudentPermissions(): Promise<StudentPermissionRow[]> {
  const rows = await db
    .select({
      id: studentPermissions.id,
      userId: studentPermissions.userId,
      personId: users.personId,
      p1: studentPermissions.p1,
      p2: studentPermissions.p2,
      officerPersonId: studentPermissions.officerPersonId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(studentPermissions)
    .innerJoin(users, eq(studentPermissions.userId, users.id))
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
        isNull(studentPermissions.schoolId),
      ),
    )
    .orderBy(asc(studentPermissions.id));

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

export async function getStudentModulePermission(id: number) {
  const rows = await listStudentPermissions();
  return rows.find((r) => r.id === id) ?? null;
}

export async function listDistrictStaffForStudentPicker(
  excludeUserId?: number,
): Promise<DistrictStaffOption[]> {
  const existing = await db
    .select({ userId: studentPermissions.userId })
    .from(studentPermissions)
    .where(isNull(studentPermissions.schoolId));

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

export async function getStudentPermissionByUserId(userId: number) {
  const [row] = await db
    .select()
    .from(studentPermissions)
    .where(
      and(
        eq(studentPermissions.userId, userId),
        isNull(studentPermissions.schoolId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listStudentsForSpacialPicker(
  scope: StudentScope,
  edYear: number,
  schoolCode: string,
) {
  const conditions = [
    eq(students.edYear, edYear),
    eq(students.schoolCode, schoolCode),
  ];
  if (scope.kind === "school") {
    conditions.push(eq(students.schoolCode, scope.schoolCode));
  }

  return db
    .select({
      id: students.id,
      personId: students.personId,
      studentId: students.studentId,
      prename: students.prename,
      name: students.name,
      surname: students.surname,
      classLevel: students.classLevel,
      classroom: students.classroom,
    })
    .from(students)
    .where(and(...conditions))
    .orderBy(asc(students.classLevel), asc(students.studentId))
    .limit(500);
}
