import { and, asc, count, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  people,
  personSchoolAssignments,
  schools,
  workgroups,
} from "@/lib/db/schema";
import { formatPersonName } from "@/lib/auth/format-name";
import { positionLabel } from "@/lib/person/position-labels";
import type { PersonScope } from "@/lib/person/scope";

export const PERSON_PAGE_SIZE = 25;

export type PersonListRow = {
  id: number;
  personId: string;
  displayName: string;
  organizationType: "district" | "school";
  schoolName: string | null;
  workgroupName: string | null;
  positionCode: number | null;
  positionLabel: string;
  status: number;
};

function scopeCondition(scope: PersonScope): SQL | undefined {
  if (scope.kind === "school") {
    return eq(people.schoolId, scope.schoolId);
  }
  return undefined;
}

function buildWhere(
  scope: PersonScope,
  q: string,
  status: "all" | "active" | "inactive",
  org: "all" | "district" | "school",
  schoolId: number | null,
  workgroupId: number | null,
) {
  const conditions: (SQL | undefined)[] = [scopeCondition(scope)];

  if (q.length >= 2) {
    conditions.push(
      or(
        ilike(people.personId, `%${q}%`),
        ilike(people.firstName, `%${q}%`),
        ilike(people.lastName, `%${q}%`),
        ilike(people.prefix, `%${q}%`),
      ),
    );
  }

  if (status === "active") conditions.push(eq(people.status, 0));
  if (status === "inactive") conditions.push(eq(people.status, 1));

  if (scope.kind === "district") {
    if (org === "district") conditions.push(eq(people.organizationType, "district"));
    if (org === "school") conditions.push(eq(people.organizationType, "school"));
    if (schoolId) conditions.push(eq(people.schoolId, schoolId));
    if (workgroupId) conditions.push(eq(people.workgroupId, workgroupId));
  }

  const filtered = conditions.filter(Boolean) as SQL[];
  return filtered.length > 0 ? and(...filtered) : undefined;
}

export async function countPeople(
  scope: PersonScope,
  q: string,
  status: "all" | "active" | "inactive",
  org: "all" | "district" | "school",
  schoolId: number | null,
  workgroupId: number | null,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(people)
    .where(buildWhere(scope, q, status, org, schoolId, workgroupId));
  return Number(row?.total ?? 0);
}

export async function listPeoplePage(input: {
  scope: PersonScope;
  q: string;
  status: "all" | "active" | "inactive";
  org: "all" | "district" | "school";
  schoolId: number | null;
  workgroupId: number | null;
  page: number;
}): Promise<PersonListRow[]> {
  const offset = (input.page - 1) * PERSON_PAGE_SIZE;

  const rows = await db
    .select({
      id: people.id,
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      organizationType: people.organizationType,
      schoolName: schools.name,
      workgroupName: workgroups.name,
      positionCode: people.positionCode,
      status: people.status,
    })
    .from(people)
    .leftJoin(schools, eq(people.schoolId, schools.id))
    .leftJoin(workgroups, eq(people.workgroupId, workgroups.id))
    .where(
      buildWhere(
        input.scope,
        input.q,
        input.status,
        input.org,
        input.schoolId,
        input.workgroupId,
      ),
    )
    .orderBy(asc(people.firstName), asc(people.lastName))
    .limit(PERSON_PAGE_SIZE)
    .offset(offset);

  return rows.map((row) => ({
    id: row.id,
    personId: row.personId,
    displayName: formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
    }),
    organizationType: row.organizationType,
    schoolName: row.schoolName,
    workgroupName: row.workgroupName,
    positionCode: row.positionCode,
    positionLabel: positionLabel(row.positionCode),
    status: row.status,
  }));
}

export async function getPersonById(id: number) {
  const [row] = await db
    .select()
    .from(people)
    .where(eq(people.id, id))
    .limit(1);
  return row ?? null;
}

export async function getPersonByPersonId(personId: string, excludeId?: number) {
  const [row] = await db
    .select({ id: people.id })
    .from(people)
    .where(eq(people.personId, personId))
    .limit(1);

  if (!row) return null;
  if (excludeId != null && row.id === excludeId) return null;
  return row;
}

export async function listPersonSchoolAssignments(personId: string) {
  return db
    .select({
      schoolId: schools.id,
      name: schools.name,
      schoolCode: schools.schoolCode,
    })
    .from(personSchoolAssignments)
    .innerJoin(schools, eq(personSchoolAssignments.schoolId, schools.id))
    .where(eq(personSchoolAssignments.personId, personId))
    .orderBy(asc(schools.schoolCode));
}

export function parsePersonListParams(params: {
  page?: string;
  q?: string;
  status?: string;
  org?: string;
  schoolId?: string;
  workgroupId?: string;
}) {
  const q = params.q?.trim() ?? "";
  const statusRaw = params.status?.trim();
  const status =
    statusRaw === "inactive" || statusRaw === "active" ? statusRaw : "all";
  const orgRaw = params.org?.trim();
  const org =
    orgRaw === "district" || orgRaw === "school" ? orgRaw : "all";
  const schoolId = params.schoolId ? Number(params.schoolId) : null;
  const workgroupId = params.workgroupId ? Number(params.workgroupId) : null;
  let page = params.page ? Number(params.page) : 1;
  if (!Number.isFinite(page) || page < 1) page = 1;
  return {
    q,
    status,
    org,
    schoolId: Number.isFinite(schoolId) && schoolId! > 0 ? schoolId : null,
    workgroupId:
      Number.isFinite(workgroupId) && workgroupId! > 0 ? workgroupId : null,
    page,
  } as const;
}

export async function resolvePersonListPage(
  scope: PersonScope,
  parsed: ReturnType<typeof parsePersonListParams>,
) {
  const total = await countPeople(
    scope,
    parsed.q,
    parsed.status,
    parsed.org,
    parsed.schoolId,
    parsed.workgroupId,
  );
  const totalPages = Math.max(1, Math.ceil(total / PERSON_PAGE_SIZE));
  return parsed.page > totalPages ? totalPages : parsed.page;
}

export async function listSchoolsForPersonFilter() {
  return db
    .select({ id: schools.id, name: schools.name, schoolCode: schools.schoolCode })
    .from(schools)
    .where(eq(schools.active, true))
    .orderBy(asc(schools.schoolCode));
}

export async function listWorkgroupsForPersonFilter() {
  return db
    .select({ id: workgroups.id, name: workgroups.name })
    .from(workgroups)
    .where(eq(workgroups.active, true))
    .orderBy(asc(workgroups.sortOrder), asc(workgroups.name));
}

export type PersonExportRow = PersonListRow;

export async function listPeopleForExport(input: {
  scope: PersonScope;
  q: string;
  status: "all" | "active" | "inactive";
  org: "all" | "district" | "school";
  schoolId: number | null;
  workgroupId: number | null;
}): Promise<PersonExportRow[]> {
  const rows = await db
    .select({
      id: people.id,
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      organizationType: people.organizationType,
      schoolName: schools.name,
      workgroupName: workgroups.name,
      positionCode: people.positionCode,
      status: people.status,
    })
    .from(people)
    .leftJoin(schools, eq(people.schoolId, schools.id))
    .leftJoin(workgroups, eq(people.workgroupId, workgroups.id))
    .where(
      buildWhere(
        input.scope,
        input.q,
        input.status,
        input.org,
        input.schoolId,
        input.workgroupId,
      ),
    )
    .orderBy(asc(people.organizationType), asc(people.firstName), asc(people.lastName));

  return rows.map((row) => ({
    id: row.id,
    personId: row.personId,
    displayName: formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
    }),
    organizationType: row.organizationType,
    schoolName: row.schoolName,
    workgroupName: row.workgroupName,
    positionCode: row.positionCode,
    positionLabel: positionLabel(row.positionCode),
    status: row.status,
  }));
}
