import {
  and,
  asc,
  count,
  desc,
  eq,
  like,
  notInArray,
  or,
  type SQL,
} from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { testClassLabel, testTypeLabel } from "@/lib/achievement/constants";
import { db } from "@/lib/db";
import {
  achievementPermissions,
  achievementScores,
  people,
  schools,
  users,
} from "@/lib/db/schema";

export const PAGE_SIZE = 25;

export type AchievementListRow = {
  id: number;
  testType: number;
  testTypeLabel: string;
  testClass: number;
  testClassLabel: string;
  edYear: number;
  schoolCode: string;
  schoolName: string | null;
  scoreAvg: number;
  recDate: string | null;
};

export type AchievementScoreDetail = AchievementListRow & {
  thai: number;
  math: number;
  science: number;
  social: number;
  english: number;
  health: number;
  art: number;
  vocation: number;
};

export type AchievementPermissionRow = {
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

function buildWhere(
  q: string,
  edYear: number | null,
  testType: number | null,
) {
  const conditions: (SQL | undefined)[] = [];

  if (q.length >= 2) {
    conditions.push(
      or(
        like(achievementScores.schoolCode, `%${q}%`),
        like(schools.name, `%${q}%`),
      ),
    );
  }
  if (edYear) conditions.push(eq(achievementScores.edYear, edYear));
  if (testType) conditions.push(eq(achievementScores.testType, testType));

  const filtered = conditions.filter(Boolean) as SQL[];
  return filtered.length > 0 ? and(...filtered) : undefined;
}

export function parseAchievementListParams(params: {
  page?: string;
  q?: string;
  edYear?: string;
  testType?: string;
}) {
  const page = Math.max(1, Number(params.page) || 1);
  const q = (params.q ?? "").trim();
  const edYearRaw = Number(params.edYear);
  const edYear =
    Number.isFinite(edYearRaw) && edYearRaw >= 2500 ? edYearRaw : null;
  const testTypeRaw = Number(params.testType);
  const testType =
    Number.isFinite(testTypeRaw) && (testTypeRaw === 1 || testTypeRaw === 2)
      ? testTypeRaw
      : null;
  return { page, q, edYear, testType };
}

export async function resolveAchievementListPage(
  total: number,
  page: number,
): Promise<number> {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Math.min(page, totalPages);
}

export async function countAchievementScores(
  q: string,
  edYear: number | null,
  testType: number | null,
): Promise<number> {
  const where = buildWhere(q, edYear, testType);
  const query = db
    .select({ total: count() })
    .from(achievementScores)
    .leftJoin(schools, eq(schools.schoolCode, achievementScores.schoolCode));

  const [row] = where ? await query.where(where) : await query;
  return Number(row?.total ?? 0);
}

export async function listAchievementScoresPage(input: {
  page: number;
  q: string;
  edYear: number | null;
  testType: number | null;
}): Promise<AchievementListRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const where = buildWhere(input.q, input.edYear, input.testType);

  const base = db
    .select({
      id: achievementScores.id,
      testType: achievementScores.testType,
      testClass: achievementScores.testClass,
      edYear: achievementScores.edYear,
      schoolCode: achievementScores.schoolCode,
      schoolName: schools.name,
      scoreAvg: achievementScores.scoreAvg,
      recDate: achievementScores.recDate,
    })
    .from(achievementScores)
    .leftJoin(schools, eq(schools.schoolCode, achievementScores.schoolCode))
    .orderBy(desc(achievementScores.edYear), asc(achievementScores.schoolCode))
    .limit(PAGE_SIZE)
    .offset(offset);

  const rows = where ? await base.where(where) : await base;

  return rows.map((row) => ({
    id: row.id,
    testType: row.testType,
    testTypeLabel: testTypeLabel(row.testType),
    testClass: row.testClass,
    testClassLabel: testClassLabel(row.testClass),
    edYear: row.edYear,
    schoolCode: row.schoolCode,
    schoolName: row.schoolName,
    scoreAvg: row.scoreAvg,
    recDate: row.recDate,
  }));
}

export async function getAchievementScore(
  id: number,
): Promise<AchievementScoreDetail | null> {
  const [row] = await db
    .select({
      id: achievementScores.id,
      testType: achievementScores.testType,
      testClass: achievementScores.testClass,
      edYear: achievementScores.edYear,
      schoolCode: achievementScores.schoolCode,
      schoolName: schools.name,
      thai: achievementScores.thai,
      math: achievementScores.math,
      science: achievementScores.science,
      social: achievementScores.social,
      english: achievementScores.english,
      health: achievementScores.health,
      art: achievementScores.art,
      vocation: achievementScores.vocation,
      scoreAvg: achievementScores.scoreAvg,
      recDate: achievementScores.recDate,
    })
    .from(achievementScores)
    .leftJoin(schools, eq(schools.schoolCode, achievementScores.schoolCode))
    .where(eq(achievementScores.id, id))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    testType: row.testType,
    testTypeLabel: testTypeLabel(row.testType),
    testClass: row.testClass,
    testClassLabel: testClassLabel(row.testClass),
    edYear: row.edYear,
    schoolCode: row.schoolCode,
    schoolName: row.schoolName,
    thai: row.thai,
    math: row.math,
    science: row.science,
    social: row.social,
    english: row.english,
    health: row.health,
    art: row.art,
    vocation: row.vocation,
    scoreAvg: row.scoreAvg,
    recDate: row.recDate,
  };
}

export async function listSchoolsForAchievementPicker() {
  return db
    .select({
      schoolCode: schools.schoolCode,
      name: schools.name,
    })
    .from(schools)
    .orderBy(asc(schools.name));
}

export async function listAchievementPermissions(): Promise<
  AchievementPermissionRow[]
> {
  const rows = await db
    .select({
      id: achievementPermissions.id,
      userId: achievementPermissions.userId,
      personId: users.personId,
      p1: achievementPermissions.p1,
      p2: achievementPermissions.p2,
      p3: achievementPermissions.p3,
      officerPersonId: achievementPermissions.officerPersonId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(achievementPermissions)
    .innerJoin(users, eq(achievementPermissions.userId, users.id))
    .leftJoin(
      people,
      and(
        eq(people.personId, users.personId),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .where(eq(users.organizationType, "district"))
    .orderBy(asc(achievementPermissions.id));

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

export async function getAchievementModulePermission(id: number) {
  const rows = await listAchievementPermissions();
  return rows.find((r) => r.id === id) ?? null;
}

export async function listDistrictStaffForAchievementPicker(
  excludeUserId?: number,
): Promise<DistrictStaffOption[]> {
  const existing = await db
    .select({ userId: achievementPermissions.userId })
    .from(achievementPermissions);

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

export async function getAchievementPermissionByUserId(userId: number) {
  const [row] = await db
    .select()
    .from(achievementPermissions)
    .where(eq(achievementPermissions.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function listDistinctEdYears(): Promise<number[]> {
  const rows = await db
    .selectDistinct({ edYear: achievementScores.edYear })
    .from(achievementScores)
    .orderBy(desc(achievementScores.edYear));
  return rows.map((r) => r.edYear);
}
