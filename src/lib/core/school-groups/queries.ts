import { asc, count, eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { schoolGroups, schools } from "@/lib/db/schema";

export const SCHOOL_GROUPS_PAGE_SIZE = 25;

export type SchoolGroupListRow = {
  id: number;
  name: string;
  sortOrder: number;
  schoolCount: number;
};

export async function getSchoolGroupById(id: number) {
  const [row] = await db
    .select({
      id: schoolGroups.id,
      name: schoolGroups.name,
      sortOrder: schoolGroups.sortOrder,
    })
    .from(schoolGroups)
    .where(eq(schoolGroups.id, id))
    .limit(1);

  return row ?? null;
}

export async function countSchoolsInGroup(groupId: number): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(schools)
    .where(eq(schools.schoolGroupId, groupId));

  return Number(row?.total ?? 0);
}

function buildSchoolGroupListWhere(q: string) {
  if (q.length >= 2) {
    return ilike(schoolGroups.name, `%${q}%`);
  }
  return undefined;
}

export async function countSchoolGroups(q: string): Promise<number> {
  const where = buildSchoolGroupListWhere(q);
  const [row] = await db
    .select({ total: count() })
    .from(schoolGroups)
    .where(where);

  return Number(row?.total ?? 0);
}

export async function listSchoolGroupsPage(input: {
  q: string;
  page: number;
}): Promise<SchoolGroupListRow[]> {
  const where = buildSchoolGroupListWhere(input.q);
  const offset = (input.page - 1) * SCHOOL_GROUPS_PAGE_SIZE;

  const rows = await db
    .select({
      id: schoolGroups.id,
      name: schoolGroups.name,
      sortOrder: schoolGroups.sortOrder,
      schoolCount: count(schools.id),
    })
    .from(schoolGroups)
    .leftJoin(schools, eq(schools.schoolGroupId, schoolGroups.id))
    .where(where)
    .groupBy(schoolGroups.id, schoolGroups.name, schoolGroups.sortOrder)
    .orderBy(asc(schoolGroups.sortOrder), asc(schoolGroups.name))
    .limit(SCHOOL_GROUPS_PAGE_SIZE)
    .offset(offset);

  return rows.map((row) => ({
    ...row,
    schoolCount: Number(row.schoolCount),
  }));
}

export function parseSchoolGroupListParams(params: {
  page?: string;
  q?: string;
}): { q: string; page: number } {
  const q = params.q?.trim() ?? "";

  let page = params.page ? Number(params.page) : 1;
  if (!Number.isFinite(page) || page < 1) page = 1;

  return { q, page };
}

export async function resolveSchoolGroupListPage(
  parsed: ReturnType<typeof parseSchoolGroupListParams>,
): Promise<number> {
  const total = await countSchoolGroups(parsed.q);
  const totalPages = Math.max(1, Math.ceil(total / SCHOOL_GROUPS_PAGE_SIZE));
  if (parsed.page > totalPages) return totalPages;
  return parsed.page;
}
