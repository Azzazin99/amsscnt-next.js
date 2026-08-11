import {
  and,
  asc,
  count,
  desc,
  eq,
  like,
  isNull,
  notInArray,
  or,
  type SQL,
} from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import {
  computeTravelDays,
  grantStatusLabel,
} from "@/lib/permission/constants";
import type { PermissionScope } from "@/lib/permission/scope";
import { db } from "@/lib/db";
import {
  people,
  permissionPermissions,
  permissionRequests,
  permissionYears,
  schools,
  users,
} from "@/lib/db/schema";

export const PAGE_SIZE = 25;

export type PermissionListRow = {
  id: number;
  refId: string;
  personId: string;
  displayName: string;
  schoolName: string | null;
  subject: string;
  place: string;
  travelStart: string;
  travelFinish: string;
  travelDays: number;
  grantStatus: number | null;
  grantStatusLabel: string;
  workflowStatusLabel: string;
  createdAt: Date;
};

export type PermissionRequestDetail = {
  id: number;
  refId: string;
  personId: string;
  displayName: string;
  schoolId: number | null;
  schoolName: string | null;
  subject: string;
  place: string;
  travelStart: string;
  travelFinish: string;
  travelDays: number;
  vehicle: string | null;
  document: string | null;
  grantStatus: number | null;
  grantComment: string | null;
  grantPersonId: string | null;
  grantDate: Date | null;
  basicGrant: number | null;
  basicComment: string | null;
  basicAt: Date | null;
  groupGrant: number | null;
  groupComment: string | null;
  groupAt: Date | null;
  createdAt: Date;
};

export type PermissionYearRow = {
  id: number;
  budgetYear: number;
  yearActive: boolean;
};

export type PermissionModulePermissionRow = {
  id: number;
  userId: number;
  personId: string;
  p1: number;
  p2: number;
  officerPersonId: string | null;
  displayName: string;
};

function scopeCondition(
  scope: PermissionScope,
  viewerPersonId: string,
): SQL | undefined {
  if (scope.kind === "district") return undefined;
  return or(
    eq(permissionRequests.schoolId, scope.schoolId),
    eq(permissionRequests.personId, viewerPersonId),
  );
}

function buildWhere(
  scope: PermissionScope,
  viewerPersonId: string,
  q: string,
  grant: "all" | "pending" | "approved" | "rejected",
) {
  const conditions: (SQL | undefined)[] = [
    scopeCondition(scope, viewerPersonId),
  ];

  if (q.length >= 2) {
    conditions.push(
      or(
        like(permissionRequests.personId, `%${q}%`),
        like(permissionRequests.subject, `%${q}%`),
        like(permissionRequests.place, `%${q}%`),
        like(people.firstName, `%${q}%`),
        like(people.lastName, `%${q}%`),
        like(people.prefix, `%${q}%`),
      ),
    );
  }

  if (grant === "pending") {
    conditions.push(isNull(permissionRequests.grantStatus));
  }
  if (grant === "approved") {
    conditions.push(eq(permissionRequests.grantStatus, 1));
  }
  if (grant === "rejected") {
    conditions.push(eq(permissionRequests.grantStatus, 0));
  }

  const filtered = conditions.filter(Boolean) as SQL[];
  return filtered.length > 0 ? and(...filtered) : undefined;
}

export function parsePermissionListParams(params: {
  page?: string;
  q?: string;
  grant?: string;
}) {
  const page = Math.max(1, Number(params.page) || 1);
  const q = (params.q ?? "").trim();
  const grant: "all" | "pending" | "approved" | "rejected" =
    params.grant === "pending" ||
    params.grant === "approved" ||
    params.grant === "rejected"
      ? params.grant
      : "all";
  return { page, q, grant };
}

export async function resolvePermissionListPage(
  total: number,
  page: number,
): Promise<number> {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Math.min(page, totalPages);
}

export async function countPermissionRequests(
  scope: PermissionScope,
  viewerPersonId: string,
  q: string,
  grant: "all" | "pending" | "approved" | "rejected",
): Promise<number> {
  const where = buildWhere(scope, viewerPersonId, q, grant);
  const query = db
    .select({ total: count() })
    .from(permissionRequests)
    .leftJoin(people, eq(people.personId, permissionRequests.personId));

  const [row] = where ? await query.where(where) : await query;
  return Number(row?.total ?? 0);
}

export async function listPermissionRequestsPage(input: {
  scope: PermissionScope;
  viewerPersonId: string;
  page: number;
  q: string;
  grant: "all" | "pending" | "approved" | "rejected";
}): Promise<PermissionListRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const where = buildWhere(
    input.scope,
    input.viewerPersonId,
    input.q,
    input.grant,
  );

  const base = db
    .select({
      id: permissionRequests.id,
      refId: permissionRequests.refId,
      personId: permissionRequests.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      schoolName: schools.name,
      subject: permissionRequests.subject,
      place: permissionRequests.place,
      travelStart: permissionRequests.travelStart,
      travelFinish: permissionRequests.travelFinish,
      grantStatus: permissionRequests.grantStatus,
      createdAt: permissionRequests.createdAt,
    })
    .from(permissionRequests)
    .leftJoin(people, eq(people.personId, permissionRequests.personId))
    .leftJoin(schools, eq(schools.id, permissionRequests.schoolId))
    .orderBy(desc(permissionRequests.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const rows = where ? await base.where(where) : await base;

  return rows.map((row) => ({
    id: row.id,
    refId: row.refId,
    personId: row.personId,
    displayName: formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      fallback: row.personId,
    }),
    schoolName: row.schoolName,
    subject: row.subject,
    place: row.place,
    travelStart: row.travelStart,
    travelFinish: row.travelFinish,
    travelDays: computeTravelDays(row.travelStart, row.travelFinish),
    grantStatus: row.grantStatus,
    grantStatusLabel: grantStatusLabel(row.grantStatus),
    workflowStatusLabel: grantStatusLabel(row.grantStatus),
    createdAt: row.createdAt,
  }));
}

export async function getPermissionRequest(
  id: number,
): Promise<PermissionRequestDetail | null> {
  const [row] = await db
    .select({
      id: permissionRequests.id,
      refId: permissionRequests.refId,
      personId: permissionRequests.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      schoolId: permissionRequests.schoolId,
      schoolName: schools.name,
      subject: permissionRequests.subject,
      place: permissionRequests.place,
      travelStart: permissionRequests.travelStart,
      travelFinish: permissionRequests.travelFinish,
      vehicle: permissionRequests.vehicle,
      document: permissionRequests.document,
      grantStatus: permissionRequests.grantStatus,
      grantComment: permissionRequests.grantComment,
      grantPersonId: permissionRequests.grantPersonId,
      grantDate: permissionRequests.grantDate,
      basicGrant: permissionRequests.basicGrant,
      basicComment: permissionRequests.basicComment,
      basicDate: permissionRequests.basicDate,
      groupGrant: permissionRequests.groupGrant,
      groupComment: permissionRequests.groupComment,
      groupDate: permissionRequests.groupDate,
      createdAt: permissionRequests.createdAt,
    })
    .from(permissionRequests)
    .leftJoin(people, eq(people.personId, permissionRequests.personId))
    .leftJoin(schools, eq(schools.id, permissionRequests.schoolId))
    .where(eq(permissionRequests.id, id))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    refId: row.refId,
    personId: row.personId,
    displayName: formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      fallback: row.personId,
    }),
    schoolId: row.schoolId,
    schoolName: row.schoolName,
    subject: row.subject,
    place: row.place,
    travelStart: row.travelStart,
    travelFinish: row.travelFinish,
    travelDays: computeTravelDays(row.travelStart, row.travelFinish),
    vehicle: row.vehicle,
    document: row.document,
    grantStatus: row.grantStatus,
    grantComment: row.grantComment,
    grantPersonId: row.grantPersonId,
    grantDate: row.grantDate,
    basicGrant: row.basicGrant,
    basicComment: row.basicComment,
    basicAt: row.basicDate,
    groupGrant: row.groupGrant,
    groupComment: row.groupComment,
    groupAt: row.groupDate,
    createdAt: row.createdAt,
  };
}

export function canViewPermissionRequest(
  request: PermissionRequestDetail,
  scope: PermissionScope,
  viewerPersonId: string,
): boolean {
  if (scope.kind === "district") return true;
  if (request.personId === viewerPersonId) return true;
  return request.schoolId === scope.schoolId;
}

export async function listPermissionYears(): Promise<PermissionYearRow[]> {
  return db
    .select({
      id: permissionYears.id,
      budgetYear: permissionYears.budgetYear,
      yearActive: permissionYears.yearActive,
    })
    .from(permissionYears)
    .orderBy(desc(permissionYears.budgetYear));
}

export async function getPermissionYear(id: number) {
  const [row] = await db
    .select()
    .from(permissionYears)
    .where(eq(permissionYears.id, id))
    .limit(1);
  return row ?? null;
}

export async function getActivePermissionYear() {
  const [row] = await db
    .select()
    .from(permissionYears)
    .where(eq(permissionYears.yearActive, true))
    .limit(1);
  return row ?? null;
}

export async function listPermissionModulePermissions(): Promise<
  PermissionModulePermissionRow[]
> {
  const rows = await db
    .select({
      id: permissionPermissions.id,
      userId: permissionPermissions.userId,
      personId: users.personId,
      p1: permissionPermissions.p1,
      p2: permissionPermissions.p2,
      officerPersonId: permissionPermissions.officerPersonId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(permissionPermissions)
    .innerJoin(users, eq(permissionPermissions.userId, users.id))
    .leftJoin(
      people,
      and(
        eq(people.personId, users.personId),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .where(eq(users.organizationType, "district"))
    .orderBy(asc(permissionPermissions.id));

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

export async function getPermissionModulePermission(id: number) {
  const rows = await listPermissionModulePermissions();
  return rows.find((r) => r.id === id) ?? null;
}

export type DistrictStaffOption = {
  userId: number;
  personId: string;
  label: string;
};

export async function listDistrictStaffForPermissionPicker(
  excludeUserId?: number,
): Promise<DistrictStaffOption[]> {
  const existing = await db
    .select({ userId: permissionPermissions.userId })
    .from(permissionPermissions);

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

export async function getPermissionModulePermissionByUserId(userId: number) {
  const [row] = await db
    .select()
    .from(permissionPermissions)
    .where(eq(permissionPermissions.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function getPersonSchoolId(personId: string): Promise<number | null> {
  const [row] = await db
    .select({ schoolId: people.schoolId })
    .from(people)
    .where(eq(people.personId, personId))
    .limit(1);
  return row?.schoolId ?? null;
}

// ---- Aliases / Stub exports for missing functions ----
export async function countOwnPermissionRequests(
  personId: string,
  q: string = "",
  grant: "all" | "pending" | "approved" | "rejected" = "all"
): Promise<number> {
  const scope: PermissionScope = { kind: "school", schoolId: -1, schoolCode: "", schoolName: "" };
  return countPermissionRequests(scope, personId, q, grant);
}

export async function listOwnPermissionRequestsPage(input: {
  personId: string;
  page: number;
  q?: string;
  grant?: "all" | "pending" | "approved" | "rejected";
}): Promise<PermissionListRow[]> {
  const scope: PermissionScope = { kind: "school", schoolId: -1, schoolCode: "", schoolName: "" };
  return listPermissionRequestsPage({
    scope,
    viewerPersonId: input.personId,
    page: input.page,
    q: input.q ?? "",
    grant: input.grant ?? "all",
  });
}

export const parseOwnPermissionRegisterParams = parsePermissionListParams;

export async function getPermissionRequesterDisplayName(personId: string): Promise<string> {
  const [row] = await db
    .select({ prefix: people.prefix, firstName: people.firstName, lastName: people.lastName })
    .from(people)
    .where(eq(people.personId, personId))
    .limit(1);
  if (!row) return personId;
  return [row.prefix, row.firstName, row.lastName].filter(Boolean).join(" ");
}

export async function listPermissionRequestFiles(_requestId: number): Promise<any[]> {
  return [];
}
