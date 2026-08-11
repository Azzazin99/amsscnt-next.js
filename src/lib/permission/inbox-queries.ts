import "server-only";

import { and, count, desc, eq, isNull, type SQL } from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import {
  permissionWorkflowStatusLabel,
} from "@/lib/permission/constants";
import { PAGE_SIZE, resolvePermissionListPage } from "@/lib/permission/queries";
import type { PermissionScope } from "@/lib/permission/scope";
import { db } from "@/lib/db";
import {
  permissionPersonSettings,
  permissionRequests,
  people,
  schools,
} from "@/lib/db/schema";

export type PermissionInboxRow = {
  id: number;
  personId: string;
  displayName: string;
  schoolName: string | null;
  subject: string;
  place: string;
  travelStart: string;
  travelFinish: string;
  travelDays: number;
  workflowStatusLabel: string;
};

function inboxScopeCondition(
  scope: PermissionScope,
  viewerPersonId: string,
): SQL | undefined {
  if (scope.kind === "district") return undefined;
  return eq(permissionRequests.schoolId, scope.schoolId);
}

function mapInboxRow(row: {
  id: number;
  personId: string;
  prefix: string | null;
  firstName: string | null;
  lastName: string | null;
  schoolName: string | null;
  subject: string;
  place: string;
  travelStart: string;
  travelFinish: string;
  basicGrant: number | null;
  grantStatus: number | null;
}): PermissionInboxRow {
  const start = new Date(`${row.travelStart}T00:00:00`);
  const finish = new Date(`${row.travelFinish}T00:00:00`);
  const travelDays =
    Math.floor((finish.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
    1;

  return {
    id: row.id,
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
    travelDays,
    workflowStatusLabel: permissionWorkflowStatusLabel({
      basicGrant: row.basicGrant,
      grantStatus: row.grantStatus,
    }),
  };
}

const inboxSelect = {
  id: permissionRequests.id,
  personId: permissionRequests.personId,
  prefix: people.prefix,
  firstName: people.firstName,
  lastName: people.lastName,
  schoolName: schools.name,
  subject: permissionRequests.subject,
  place: permissionRequests.place,
  travelStart: permissionRequests.travelStart,
  travelFinish: permissionRequests.travelFinish,
  basicGrant: permissionRequests.basicGrant,
  grantStatus: permissionRequests.grantStatus,
};

function basicApprovalWhere(
  scope: PermissionScope,
  viewerPersonId: string,
): SQL {
  const parts: SQL[] = [
    isNull(permissionRequests.basicGrant),
    eq(permissionPersonSettings.groupPersonId, viewerPersonId),
  ];
  const scopeCond = inboxScopeCondition(scope, viewerPersonId);
  if (scopeCond) parts.push(scopeCond);
  return and(...parts)!;
}

function grantApprovalWhere(
  scope: PermissionScope,
  viewerPersonId: string,
): SQL {
  const parts: SQL[] = [
    eq(permissionRequests.basicGrant, 1),
    isNull(permissionRequests.grantStatus),
    eq(permissionPersonSettings.grantPersonId, viewerPersonId),
  ];
  const scopeCond = inboxScopeCondition(scope, viewerPersonId);
  if (scopeCond) parts.push(scopeCond);
  return and(...parts)!;
}

export async function countBasicApproval(
  scope: PermissionScope,
  viewerPersonId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(permissionRequests)
    .innerJoin(
      permissionPersonSettings,
      eq(permissionPersonSettings.personId, permissionRequests.personId),
    )
    .where(basicApprovalWhere(scope, viewerPersonId));
  return Number(row?.total ?? 0);
}

export async function listBasicApprovalPage(input: {
  scope: PermissionScope;
  viewerPersonId: string;
  page: number;
}): Promise<PermissionInboxRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const rows = await db
    .select(inboxSelect)
    .from(permissionRequests)
    .innerJoin(
      permissionPersonSettings,
      eq(permissionPersonSettings.personId, permissionRequests.personId),
    )
    .leftJoin(people, eq(people.personId, permissionRequests.personId))
    .leftJoin(schools, eq(schools.id, permissionRequests.schoolId))
    .where(basicApprovalWhere(input.scope, input.viewerPersonId))
    .orderBy(desc(permissionRequests.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  return rows.map(mapInboxRow);
}

export async function countGrantApproval(
  scope: PermissionScope,
  viewerPersonId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(permissionRequests)
    .innerJoin(
      permissionPersonSettings,
      eq(permissionPersonSettings.personId, permissionRequests.personId),
    )
    .where(grantApprovalWhere(scope, viewerPersonId));
  return Number(row?.total ?? 0);
}

export async function listGrantApprovalPage(input: {
  scope: PermissionScope;
  viewerPersonId: string;
  page: number;
}): Promise<PermissionInboxRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const rows = await db
    .select(inboxSelect)
    .from(permissionRequests)
    .innerJoin(
      permissionPersonSettings,
      eq(permissionPersonSettings.personId, permissionRequests.personId),
    )
    .leftJoin(people, eq(people.personId, permissionRequests.personId))
    .leftJoin(schools, eq(schools.id, permissionRequests.schoolId))
    .where(grantApprovalWhere(input.scope, input.viewerPersonId))
    .orderBy(desc(permissionRequests.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  return rows.map(mapInboxRow);
}

export { resolvePermissionListPage as resolveInboxPage };
