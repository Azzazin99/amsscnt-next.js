// ponytail: mirrors inbox-queries approval where-clauses for leave_cancellations;
// keep separate until a third inbox variant justifies a shared SQL builder.
import "server-only";

import {
  and,
  count,
  desc,
  eq,
  isNotNull,
  isNull,
  type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  leaveCancellations,
  leavePersonSettings,
  leaveRequests,
  people,
  schools,
  users,
} from "@/lib/db/schema";
import {
  currentWorkflowStatus,
  leaveTypeLabel,
  workflowStatusLabel,
} from "@/lib/leave/constants";
import { resolveLeavePersonDisplayName } from "@/lib/leave/display-name";
import type { LeaveInboxRow } from "@/lib/leave/inbox-queries";
import { PAGE_SIZE } from "@/lib/leave/queries";

const cancellationInboxSelect = {
  id: leaveCancellations.id,
  personId: leaveCancellations.personId,
  prefix: people.prefix,
  firstName: people.firstName,
  lastName: people.lastName,
  userName: users.name,
  schoolName: schools.name,
  schoolId: leaveRequests.schoolId,
  leaveType: leaveCancellations.leaveType,
  cancelStart: leaveCancellations.cancelStart,
  cancelFinish: leaveCancellations.cancelFinish,
  cancelTotal: leaveCancellations.cancelTotal,
  groupDate: leaveCancellations.groupDate,
  commanderGrant: leaveCancellations.commanderGrant,
};

function mapCancellationInboxRow(row: {
  id: number;
  personId: string;
  prefix: string | null;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  schoolName: string | null;
  schoolId: number | null;
  leaveType: number;
  cancelStart: string;
  cancelFinish: string;
  cancelTotal: number;
  groupDate: Date | null;
  commanderGrant: number | null;
}): LeaveInboxRow {
  const workflow = currentWorkflowStatus({
    schoolId: row.schoolId,
    groupDate: row.groupDate,
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
    leaveStart: row.cancelStart,
    leaveFinish: row.cancelFinish,
    leaveTotal: row.cancelTotal,
    workflowStatusLabel: workflowStatusLabel(workflow),
    jobPersonSigned: false,
  };
}

function groupCancellationApprovalWhere(viewerPersonId: string): SQL {
  return and(
    isNull(leaveCancellations.commanderGrant),
    isNull(leaveCancellations.groupDate),
    eq(leavePersonSettings.commentPersonId, viewerPersonId),
  )!;
}

export async function countGroupCancellationApproval(
  viewerPersonId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(leaveCancellations)
    .innerJoin(
      leavePersonSettings,
      eq(leavePersonSettings.personId, leaveCancellations.personId),
    )
    .where(groupCancellationApprovalWhere(viewerPersonId));
  return Number(row?.total ?? 0);
}

export async function listGroupCancellationApprovalPage(input: {
  viewerPersonId: string;
  page: number;
}): Promise<LeaveInboxRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const rows = await db
    .select(cancellationInboxSelect)
    .from(leaveCancellations)
    .innerJoin(
      leavePersonSettings,
      eq(leavePersonSettings.personId, leaveCancellations.personId),
    )
    .leftJoin(people, eq(people.personId, leaveCancellations.personId))
    .leftJoin(users, eq(users.personId, leaveCancellations.personId))
    .leftJoin(leaveRequests, eq(leaveRequests.id, leaveCancellations.sourceRequestId))
    .leftJoin(schools, eq(schools.id, leaveRequests.schoolId))
    .where(groupCancellationApprovalWhere(input.viewerPersonId))
    .orderBy(desc(leaveCancellations.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  return rows.map(mapCancellationInboxRow);
}

function group2CancellationApprovalWhere(viewerPersonId: string): SQL {
  return and(
    isNull(leaveCancellations.commanderGrant),
    isNotNull(leaveCancellations.groupDate),
    isNull(leaveRequests.schoolId),
    eq(leavePersonSettings.commentPerson2Id, viewerPersonId),
  )!;
}

export async function countGroup2CancellationApproval(
  viewerPersonId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(leaveCancellations)
    .innerJoin(
      leavePersonSettings,
      eq(leavePersonSettings.personId, leaveCancellations.personId),
    )
    .innerJoin(
      leaveRequests,
      eq(leaveRequests.id, leaveCancellations.sourceRequestId),
    )
    .where(group2CancellationApprovalWhere(viewerPersonId));
  return Number(row?.total ?? 0);
}

export async function listGroup2CancellationApprovalPage(input: {
  viewerPersonId: string;
  page: number;
}): Promise<LeaveInboxRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const rows = await db
    .select(cancellationInboxSelect)
    .from(leaveCancellations)
    .innerJoin(
      leavePersonSettings,
      eq(leavePersonSettings.personId, leaveCancellations.personId),
    )
    .innerJoin(
      leaveRequests,
      eq(leaveRequests.id, leaveCancellations.sourceRequestId),
    )
    .leftJoin(people, eq(people.personId, leaveCancellations.personId))
    .leftJoin(users, eq(users.personId, leaveCancellations.personId))
    .leftJoin(schools, eq(schools.id, leaveRequests.schoolId))
    .where(group2CancellationApprovalWhere(input.viewerPersonId))
    .orderBy(desc(leaveCancellations.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  return rows.map(mapCancellationInboxRow);
}

function commanderCancellationApprovalWhere(viewerPersonId: string): SQL {
  return and(
    isNull(leaveCancellations.commanderGrant),
    isNotNull(leaveCancellations.groupDate),
    isNotNull(leaveRequests.schoolId),
    eq(leavePersonSettings.grantPersonId, viewerPersonId),
  )!;
}

export async function countCommanderCancellationApproval(
  viewerPersonId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(leaveCancellations)
    .innerJoin(
      leavePersonSettings,
      eq(leavePersonSettings.personId, leaveCancellations.personId),
    )
    .innerJoin(
      leaveRequests,
      eq(leaveRequests.id, leaveCancellations.sourceRequestId),
    )
    .where(commanderCancellationApprovalWhere(viewerPersonId));
  return Number(row?.total ?? 0);
}

export async function listCommanderCancellationApprovalPage(input: {
  viewerPersonId: string;
  page: number;
}): Promise<LeaveInboxRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const rows = await db
    .select(cancellationInboxSelect)
    .from(leaveCancellations)
    .innerJoin(
      leavePersonSettings,
      eq(leavePersonSettings.personId, leaveCancellations.personId),
    )
    .innerJoin(
      leaveRequests,
      eq(leaveRequests.id, leaveCancellations.sourceRequestId),
    )
    .leftJoin(people, eq(people.personId, leaveCancellations.personId))
    .leftJoin(users, eq(users.personId, leaveCancellations.personId))
    .leftJoin(schools, eq(schools.id, leaveRequests.schoolId))
    .where(commanderCancellationApprovalWhere(input.viewerPersonId))
    .orderBy(desc(leaveCancellations.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  return rows.map(mapCancellationInboxRow);
}
