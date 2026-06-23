import "server-only";

import {
  and,
  count,
  desc,
  eq,
  isNotNull,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";
import { resolveLeavePersonDisplayName } from "@/lib/leave/display-name";
import {
  currentWorkflowStatus,
  leaveTypeLabel,
  workflowStatusLabel,
} from "@/lib/leave/constants";
import {
  PAGE_SIZE,
  resolveLeaveListPage,
} from "@/lib/leave/queries";
import type { LeaveScope } from "@/lib/leave/scope";
import { db } from "@/lib/db";
import {
  leavePersonSettings,
  leaveRequests,
  people,
  schools,
  users,
} from "@/lib/db/schema";

export type LeaveInboxRow = {
  id: number;
  personId: string;
  displayName: string;
  schoolName: string | null;
  leaveTypeLabel: string;
  leaveStart: string;
  leaveFinish: string;
  leaveTotal: number;
  workflowStatusLabel: string;
  jobPersonSigned: boolean;
};

function inboxScopeCondition(
  scope: LeaveScope,
  viewerPersonId: string,
): SQL | undefined {
  if (scope.kind === "district") return undefined;
  return or(
    eq(leaveRequests.schoolId, scope.schoolId),
    eq(leaveRequests.personId, viewerPersonId),
  );
}

function mapInboxRow(row: {
  id: number;
  personId: string;
  prefix: string | null;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  schoolName: string | null;
  schoolId: number | null;
  leaveType: number;
  leaveStart: string;
  leaveFinish: string;
  leaveTotal: number;
  groupDate: Date | null;
  groupDate2: Date | null;
  commanderGrant: number | null;
  jobPersonSigned: boolean;
}): LeaveInboxRow {
  const workflow = currentWorkflowStatus({
    schoolId: row.schoolId,
    groupDate: row.groupDate,
    groupDate2: row.groupDate2,
    commanderGrant: row.commanderGrant,
  });

  return {
    id: row.id,
    personId: row.personId,
    displayName: resolveLeavePersonDisplayName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      userName: row.userName,
      personId: row.personId,
    }),
    schoolName: row.schoolName,
    leaveTypeLabel: leaveTypeLabel(row.leaveType),
    leaveStart: row.leaveStart,
    leaveFinish: row.leaveFinish,
    leaveTotal: row.leaveTotal,
    workflowStatusLabel: workflowStatusLabel(workflow),
    jobPersonSigned: row.jobPersonSigned,
  };
}

const inboxSelect = {
  id: leaveRequests.id,
  personId: leaveRequests.personId,
  prefix: people.prefix,
  firstName: people.firstName,
  lastName: people.lastName,
  userName: users.name,
  schoolName: schools.name,
  schoolId: leaveRequests.schoolId,
  leaveType: leaveRequests.leaveType,
  leaveStart: leaveRequests.leaveStart,
  leaveFinish: leaveRequests.leaveFinish,
  leaveTotal: leaveRequests.leaveTotal,
  groupDate: leaveRequests.groupDate,
  groupDate2: leaveRequests.groupDate2,
  commanderGrant: leaveRequests.commanderGrant,
  jobPersonSigned: leaveRequests.jobPersonSigned,
};

function jobHandoverWhere(
  scope: LeaveScope,
  viewerPersonId: string,
): SQL {
  const parts: SQL[] = [
    eq(leaveRequests.jobPersonId, viewerPersonId),
    eq(leaveRequests.jobPersonSigned, false),
    isNull(leaveRequests.commanderGrant),
    isNotNull(leaveRequests.jobPersonId),
  ];
  const scopeCond = inboxScopeCondition(scope, viewerPersonId);
  if (scopeCond) parts.push(scopeCond);
  return and(...parts)!;
}

export async function countJobHandover(
  scope: LeaveScope,
  viewerPersonId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(leaveRequests)
    .where(jobHandoverWhere(scope, viewerPersonId));
  return Number(row?.total ?? 0);
}

export async function listJobHandoverPage(input: {
  scope: LeaveScope;
  viewerPersonId: string;
  page: number;
}): Promise<LeaveInboxRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const rows = await db
    .select(inboxSelect)
    .from(leaveRequests)
    .leftJoin(people, eq(people.personId, leaveRequests.personId))
    .leftJoin(users, eq(users.personId, leaveRequests.personId))
    .leftJoin(schools, eq(schools.id, leaveRequests.schoolId))
    .where(jobHandoverWhere(input.scope, input.viewerPersonId))
    .orderBy(desc(leaveRequests.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  return rows.map(mapInboxRow);
}

function groupApprovalWhere(viewerPersonId: string): SQL {
  return and(
    isNull(leaveRequests.commanderGrant),
    isNull(leaveRequests.groupDate),
    eq(leavePersonSettings.commentPersonId, viewerPersonId),
  )!;
}

export async function countGroupApproval(
  viewerPersonId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(leaveRequests)
    .innerJoin(
      leavePersonSettings,
      eq(leavePersonSettings.personId, leaveRequests.personId),
    )
    .where(groupApprovalWhere(viewerPersonId));
  return Number(row?.total ?? 0);
}

export async function listGroupApprovalPage(input: {
  viewerPersonId: string;
  page: number;
}): Promise<LeaveInboxRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const rows = await db
    .select(inboxSelect)
    .from(leaveRequests)
    .innerJoin(
      leavePersonSettings,
      eq(leavePersonSettings.personId, leaveRequests.personId),
    )
    .leftJoin(people, eq(people.personId, leaveRequests.personId))
    .leftJoin(users, eq(users.personId, leaveRequests.personId))
    .leftJoin(schools, eq(schools.id, leaveRequests.schoolId))
    .where(groupApprovalWhere(input.viewerPersonId))
    .orderBy(desc(leaveRequests.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  return rows.map(mapInboxRow);
}

function group2ApprovalWhere(viewerPersonId: string): SQL {
  return and(
    isNull(leaveRequests.commanderGrant),
    isNotNull(leaveRequests.groupDate),
    isNull(leaveRequests.schoolId),
    isNull(leaveRequests.groupDate2),
    eq(leavePersonSettings.commentPerson2Id, viewerPersonId),
  )!;
}

export async function countGroup2Approval(
  viewerPersonId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(leaveRequests)
    .innerJoin(
      leavePersonSettings,
      eq(leavePersonSettings.personId, leaveRequests.personId),
    )
    .where(group2ApprovalWhere(viewerPersonId));
  return Number(row?.total ?? 0);
}

export async function listGroup2ApprovalPage(input: {
  viewerPersonId: string;
  page: number;
}): Promise<LeaveInboxRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const rows = await db
    .select(inboxSelect)
    .from(leaveRequests)
    .innerJoin(
      leavePersonSettings,
      eq(leavePersonSettings.personId, leaveRequests.personId),
    )
    .leftJoin(people, eq(people.personId, leaveRequests.personId))
    .leftJoin(users, eq(users.personId, leaveRequests.personId))
    .leftJoin(schools, eq(schools.id, leaveRequests.schoolId))
    .where(group2ApprovalWhere(input.viewerPersonId))
    .orderBy(desc(leaveRequests.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  return rows.map(mapInboxRow);
}

function commanderApprovalWhere(viewerPersonId: string): SQL {
  return and(
    isNull(leaveRequests.commanderGrant),
    isNotNull(leaveRequests.groupDate),
    isNotNull(leaveRequests.schoolId),
    eq(leavePersonSettings.grantPersonId, viewerPersonId),
  )!;
}

export async function countCommanderApproval(
  viewerPersonId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(leaveRequests)
    .innerJoin(
      leavePersonSettings,
      eq(leavePersonSettings.personId, leaveRequests.personId),
    )
    .where(commanderApprovalWhere(viewerPersonId));
  return Number(row?.total ?? 0);
}

export async function listCommanderApprovalPage(input: {
  viewerPersonId: string;
  page: number;
}): Promise<LeaveInboxRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const rows = await db
    .select(inboxSelect)
    .from(leaveRequests)
    .innerJoin(
      leavePersonSettings,
      eq(leavePersonSettings.personId, leaveRequests.personId),
    )
    .leftJoin(people, eq(people.personId, leaveRequests.personId))
    .leftJoin(users, eq(users.personId, leaveRequests.personId))
    .leftJoin(schools, eq(schools.id, leaveRequests.schoolId))
    .where(commanderApprovalWhere(input.viewerPersonId))
    .orderBy(desc(leaveRequests.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  return rows.map(mapInboxRow);
}

export { resolveLeaveListPage as resolveInboxPage };
