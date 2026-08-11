import { and, asc, count, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  people,
  personDelegate,
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
  schoolId: number | null;
  schoolName: string | null;
  workgroupName: string | null;
  positionCode: number | null;
  positionLabel: string;
  status: number;
  birthDate: string | null;
  personOrder: number | null;
  pictureUrl: string | null;
  extraSchools?: { id: number; name: string; schoolCode: string }[];
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
  status: "all" | "active" | "inactive" | "pending",
  org: "all" | "district" | "school",
  schoolId: number | null,
  workgroupId: number | null,
  filter?: "multi-school" | "acting-director" | null,
) {
  const conditions: (SQL | undefined)[] = [scopeCondition(scope)];

  if (q.length >= 2) {
    conditions.push(
      or(
        like(people.personId, `%${q}%`),
        like(people.firstName, `%${q}%`),
        like(people.lastName, `%${q}%`),
        like(people.prefix, `%${q}%`),
      ),
    );
  }

  if (status === "active") conditions.push(eq(people.status, 0));
  if (status === "inactive") conditions.push(eq(people.status, 1));
  if (status === "pending") conditions.push(eq(people.status, 9));

  if (filter === "multi-school") {
    conditions.push(eq(people.multiSchool, true));
  }

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
  status: "all" | "active" | "inactive" | "pending",
  org: "all" | "district" | "school",
  schoolId: number | null,
  workgroupId: number | null,
  filter?: "multi-school" | "acting-director" | null,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(people)
    .where(buildWhere(scope, q, status, org, schoolId, workgroupId, filter));
  return Number(row?.total ?? 0);
}

export async function listPeoplePage(input: {
  scope: PersonScope;
  q: string;
  status: "all" | "active" | "inactive" | "pending";
  org: "all" | "district" | "school";
  schoolId: number | null;
  workgroupId: number | null;
  filter?: "multi-school" | "acting-director" | null;
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
      schoolId: people.schoolId,
      schoolName: schools.name,
      workgroupName: workgroups.name,
      positionCode: people.positionCode,
      status: people.status,
      birthDate: people.birthDate,
      personOrder: people.personOrder,
      pictureUrl: people.pictureUrl,
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
        input.filter,
      ),
    )
    .orderBy(
      ...(input.org === "district" || input.scope.kind === "district"
        ? [
            asc(workgroups.sortOrder),
            asc(people.positionCode),
            asc(people.personOrder),
            asc(people.firstName),
            asc(people.lastName),
          ]
        : [asc(people.firstName), asc(people.lastName)]),
    )
    .limit(PERSON_PAGE_SIZE)
    .offset(offset);

  const resultRows: PersonListRow[] = rows.map((row) => ({
    id: row.id,
    personId: row.personId,
    displayName: formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
    }),
    organizationType: row.organizationType,
    schoolId: row.schoolId,
    schoolName: row.schoolName,
    workgroupName: row.workgroupName,
    positionCode: row.positionCode,
    positionLabel: positionLabel(row.positionCode, row.organizationType),
    status: row.status,
    birthDate: row.birthDate,
    personOrder: row.personOrder,
    pictureUrl: row.pictureUrl,
  }));

  if (input.filter === "multi-school" && resultRows.length > 0) {
    const personIds = resultRows.map((r) => r.personId);
    const extraRows = await db
      .select({
        personId: personSchoolAssignments.personId,
        schoolId: schools.id,
        name: schools.name,
        schoolCode: schools.schoolCode,
      })
      .from(personSchoolAssignments)
      .innerJoin(schools, eq(personSchoolAssignments.schoolId, schools.id))
      .where(inArray(personSchoolAssignments.personId, personIds));

    const extraMap = new Map<string, { id: number; name: string; schoolCode: string }[]>();
    for (const er of extraRows) {
      const list = extraMap.get(er.personId) ?? [];
      list.push({ id: er.schoolId, name: er.name, schoolCode: er.schoolCode });
      extraMap.set(er.personId, list);
    }

    for (const row of resultRows) {
      row.extraSchools = extraMap.get(row.personId) ?? [];
    }
  }

  return resultRows;
}

export async function listAllDistrictPeople() {
  const rows = await db
    .select({
      id: people.id,
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      positionCode: people.positionCode,
      workgroupName: workgroups.name,
    })
    .from(people)
    .leftJoin(workgroups, eq(people.workgroupId, workgroups.id))
    .where(
      and(
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .orderBy(asc(people.positionCode), asc(people.id));

  return rows.map((row) => ({
    id: row.id,
    personId: row.personId,
    prefix: row.prefix,
    firstName: row.firstName,
    lastName: row.lastName,
    positionName: positionLabel(row.positionCode),
    groupName: row.workgroupName,
    hasSignature: false,
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
  filter?: string;
}) {
  const q = params.q?.trim() ?? "";
  const statusRaw = params.status?.trim();
  const status =
    statusRaw === "all" || statusRaw === "inactive" || statusRaw === "pending" ? statusRaw : "active";
  const orgRaw = params.org?.trim();
  const org =
    orgRaw === "district" || orgRaw === "school" ? orgRaw : "all";
  const schoolId = params.schoolId ? Number(params.schoolId) : null;
  const workgroupId = params.workgroupId ? Number(params.workgroupId) : null;
  const filterRaw = params.filter?.trim();
  const filter =
    filterRaw === "multi-school" || filterRaw === "acting-director" ? filterRaw : null;
  let page = params.page ? Number(params.page) : 1;
  if (!Number.isFinite(page) || page < 1) page = 1;
  return {
    q,
    status,
    org,
    schoolId: Number.isFinite(schoolId) && schoolId! > 0 ? schoolId : null,
    workgroupId:
      Number.isFinite(workgroupId) && workgroupId! > 0 ? workgroupId : null,
    filter,
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
    parsed.filter,
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
  status: "all" | "active" | "inactive" | "pending";
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
      schoolId: people.schoolId,
      schoolName: schools.name,
      workgroupName: workgroups.name,
      positionCode: people.positionCode,
      status: people.status,
      birthDate: people.birthDate,
      personOrder: people.personOrder,
      pictureUrl: people.pictureUrl,
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
    schoolId: row.schoolId,
    schoolName: row.schoolName,
    workgroupName: row.workgroupName,
    positionCode: row.positionCode,
    positionLabel: positionLabel(row.positionCode, row.organizationType),
    status: row.status,
    birthDate: row.birthDate,
    personOrder: row.personOrder,
    pictureUrl: row.pictureUrl,
  }));
}

export type ActingDirectorRow = {
  id: number;
  schoolCode: string;
  schoolName: string;
  personId: string;
  displayName: string;
  positionCode: number | null;
  positionLabel: string;
  start: string;
  finish: string;
  remark: string;
};

export async function countActingDirectors(): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(personDelegate);
  return Number(row?.total ?? 0);
}

export async function listActingDirectorsPage(input: {
  page: number;
}): Promise<ActingDirectorRow[]> {
  const offset = (input.page - 1) * PERSON_PAGE_SIZE;

  const rows = await db
    .select({
      id: personDelegate.id,
      schoolCode: personDelegate.schoolCode,
      schoolName: schools.name,
      personId: personDelegate.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      positionCode: people.positionCode,
      organizationType: people.organizationType,
      start: personDelegate.start,
      finish: personDelegate.finish,
      remark: personDelegate.remark,
    })
    .from(personDelegate)
    .leftJoin(schools, eq(personDelegate.schoolCode, schools.schoolCode))
    .leftJoin(people, eq(personDelegate.personId, people.personId))
    .orderBy(asc(personDelegate.start))
    .limit(PERSON_PAGE_SIZE)
    .offset(offset);

  return rows.map((r) => ({
    id: r.id,
    schoolCode: r.schoolCode,
    schoolName: r.schoolName ?? r.schoolCode,
    personId: r.personId,
    displayName: formatPersonName({
      prefix: r.prefix,
      firstName: r.firstName,
      lastName: r.lastName,
    }),
    positionCode: r.positionCode,
    positionLabel: positionLabel(r.positionCode, r.organizationType ?? "school"),
    start: r.start,
    finish: r.finish,
    remark: r.remark ?? "",
  }));
}

