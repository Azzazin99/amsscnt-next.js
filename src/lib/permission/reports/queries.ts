import "server-only";

import { and, asc, count, desc, eq, gte, lte, or, type SQL } from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import {
  grantStatusLabel,
  permissionWorkflowStatusLabel,
} from "@/lib/permission/constants";
import { PAGE_SIZE, resolvePermissionListPage } from "@/lib/permission/queries";
import type { PermissionScope } from "@/lib/permission/scope";
import { db } from "@/lib/db";
import { permissionRequests, people, schools } from "@/lib/db/schema";

export type PermissionReportListRow = {
  id: number;
  refId: string;
  displayName: string;
  schoolName: string | null;
  requestDate: string;
  subject: string;
  place: string;
  travelStart: string;
  travelFinish: string;
  travelDays: number;
  workflowLabel: string;
  grantLabel: string;
};

function reportScopeCondition(
  scope: PermissionScope,
  viewerPersonId: string,
): SQL | undefined {
  if (scope.kind === "district") return undefined;
  return or(
    eq(permissionRequests.schoolId, scope.schoolId),
    eq(permissionRequests.personId, viewerPersonId),
  );
}

export function mapReportRow(row: {
  id: number;
  refId: string;
  prefix: string | null;
  firstName: string | null;
  lastName: string | null;
  personId: string;
  schoolName: string | null;
  createdAt: Date;
  subject: string;
  place: string;
  travelStart: string;
  travelFinish: string;
  basicGrant: number | null;
  grantStatus: number | null;
}): PermissionReportListRow {
  const start = new Date(`${row.travelStart}T00:00:00`);
  const finish = new Date(`${row.travelFinish}T00:00:00`);
  const travelDays =
    Math.floor((finish.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
    1;

  return {
    id: row.id,
    refId: row.refId,
    displayName: formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      fallback: row.personId,
    }),
    schoolName: row.schoolName,
    requestDate: row.createdAt.toISOString().slice(0, 10),
    subject: row.subject,
    place: row.place,
    travelStart: row.travelStart,
    travelFinish: row.travelFinish,
    travelDays,
    workflowLabel: permissionWorkflowStatusLabel({
      basicGrant: row.basicGrant,
      grantStatus: row.grantStatus,
    }),
    grantLabel: grantStatusLabel(row.grantStatus),
  };
}

export const reportSelect = {
  id: permissionRequests.id,
  refId: permissionRequests.refId,
  personId: permissionRequests.personId,
  prefix: people.prefix,
  firstName: people.firstName,
  lastName: people.lastName,
  schoolName: schools.name,
  createdAt: permissionRequests.createdAt,
  subject: permissionRequests.subject,
  place: permissionRequests.place,
  travelStart: permissionRequests.travelStart,
  travelFinish: permissionRequests.travelFinish,
  basicGrant: permissionRequests.basicGrant,
  grantStatus: permissionRequests.grantStatus,
};

export async function listPermissionOnDate(
  scope: PermissionScope,
  viewerPersonId: string,
  isoDate: string,
): Promise<PermissionReportListRow[]> {
  const conditions = [
    reportScopeCondition(scope, viewerPersonId),
    lte(permissionRequests.travelStart, isoDate),
    gte(permissionRequests.travelFinish, isoDate),
  ].filter(Boolean) as SQL[];

  const rows = await db
    .select(reportSelect)
    .from(permissionRequests)
    .leftJoin(people, eq(people.personId, permissionRequests.personId))
    .leftJoin(schools, eq(schools.id, permissionRequests.schoolId))
    .where(and(...conditions))
    .orderBy(asc(permissionRequests.travelStart), asc(permissionRequests.id));

  return rows.map(mapReportRow);
}

export async function countPermissionReportAll(
  scope: PermissionScope,
  viewerPersonId: string,
): Promise<number> {
  const scopeCond = reportScopeCondition(scope, viewerPersonId);
  const query = db.select({ total: count() }).from(permissionRequests);
  const [row] = scopeCond ? await query.where(scopeCond) : await query;
  return Number(row?.total ?? 0);
}

export async function listPermissionReportAllPage(input: {
  scope: PermissionScope;
  viewerPersonId: string;
  page: number;
}): Promise<PermissionReportListRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const scopeCond = reportScopeCondition(input.scope, input.viewerPersonId);

  const base = db
    .select(reportSelect)
    .from(permissionRequests)
    .leftJoin(people, eq(people.personId, permissionRequests.personId))
    .leftJoin(schools, eq(schools.id, permissionRequests.schoolId))
    .orderBy(desc(permissionRequests.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  const rows = scopeCond ? await base.where(scopeCond) : await base;
  return rows.map(mapReportRow);
}

export async function listPermissionForPrint(input: {
  personId: string;
}): Promise<PermissionReportListRow[]> {
  const rows = await db
    .select(reportSelect)
    .from(permissionRequests)
    .leftJoin(people, eq(people.personId, permissionRequests.personId))
    .leftJoin(schools, eq(schools.id, permissionRequests.schoolId))
    .where(eq(permissionRequests.personId, input.personId))
    .orderBy(desc(permissionRequests.travelStart), asc(permissionRequests.id));

  return rows.map(mapReportRow);
}

export { resolvePermissionListPage as resolveReportPage };
