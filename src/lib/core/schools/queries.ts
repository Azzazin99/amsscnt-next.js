import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { schoolGroups, schools } from "@/lib/db/schema";

export const SCHOOLS_PAGE_SIZE = 25;

export type SchoolListRow = {
  id: number;
  schoolCode: string;
  name: string;
  schoolType: number;
  schoolGroupId: number | null;
  schoolGroupName: string | null;
  active: boolean;
};

export type SchoolGroupOption = {
  id: number;
  name: string;
};

export async function listSchoolGroupsForSelect(): Promise<SchoolGroupOption[]> {
  return db
    .select({ id: schoolGroups.id, name: schoolGroups.name })
    .from(schoolGroups)
    .orderBy(asc(schoolGroups.sortOrder), asc(schoolGroups.name));
}

export async function getSchoolById(id: number) {
  const [row] = await db
    .select({
      id: schools.id,
      schoolCode: schools.schoolCode,
      name: schools.name,
      schoolType: schools.schoolType,
      schoolGroupId: schools.schoolGroupId,
      active: schools.active,
    })
    .from(schools)
    .where(eq(schools.id, id))
    .limit(1);

  return row ?? null;
}

export async function getSchoolByCode(schoolCode: string) {
  const [row] = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.schoolCode, schoolCode))
    .limit(1);

  return row ?? null;
}

function buildSchoolListWhere(q: string, status: "all" | "active" | "inactive") {
  const conditions = [];

  if (q.length >= 2) {
    const pattern = `%${q}%`;
    conditions.push(
      or(ilike(schools.schoolCode, pattern), ilike(schools.name, pattern)),
    );
  }

  if (status === "active") {
    conditions.push(eq(schools.active, true));
  } else if (status === "inactive") {
    conditions.push(eq(schools.active, false));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function countSchools(
  q: string,
  status: "all" | "active" | "inactive",
): Promise<number> {
  const where = buildSchoolListWhere(q, status);
  const [row] = await db
    .select({ total: count() })
    .from(schools)
    .where(where);

  return Number(row?.total ?? 0);
}

export async function listSchoolsPage(input: {
  q: string;
  status: "all" | "active" | "inactive";
  page: number;
}): Promise<SchoolListRow[]> {
  const where = buildSchoolListWhere(input.q, input.status);
  const offset = (input.page - 1) * SCHOOLS_PAGE_SIZE;

  return db
    .select({
      id: schools.id,
      schoolCode: schools.schoolCode,
      name: schools.name,
      schoolType: schools.schoolType,
      schoolGroupId: schools.schoolGroupId,
      schoolGroupName: schoolGroups.name,
      active: schools.active,
    })
    .from(schools)
    .leftJoin(schoolGroups, eq(schools.schoolGroupId, schoolGroups.id))
    .where(where)
    .orderBy(asc(schools.schoolType), asc(schools.schoolCode))
    .limit(SCHOOLS_PAGE_SIZE)
    .offset(offset);
}

export function parseSchoolListParams(params: {
  page?: string;
  q?: string;
  status?: string;
}): { q: string; status: "all" | "active" | "inactive"; page: number } {
  const q = params.q?.trim() ?? "";
  const statusRaw = params.status?.trim();
  const status =
    statusRaw === "inactive" || statusRaw === "active" ? statusRaw : "all";

  let page = params.page ? Number(params.page) : 1;
  if (!Number.isFinite(page) || page < 1) page = 1;

  return { q, status, page };
}

export async function resolveSchoolListPage(
  parsed: ReturnType<typeof parseSchoolListParams>,
): Promise<number> {
  const total = await countSchools(parsed.q, parsed.status);
  const totalPages = Math.max(1, Math.ceil(total / SCHOOLS_PAGE_SIZE));
  if (parsed.page > totalPages) return totalPages;
  return parsed.page;
}
