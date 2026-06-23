import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  notInArray,
  or,
  type SQL,
} from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { resolveLeavePersonDisplayName } from "@/lib/leave/display-name";
import {
  leaveTypeLabel,
  grantStatusLabel,
  workflowStatusLabel,
  currentWorkflowStatus,
} from "@/lib/leave/constants";
import type { HalfDayPeriod } from "@/lib/leave/regulation/types";
import { isLeaveTypeId } from "@/lib/leave/regulation/types";
import type { LeaveScope } from "@/lib/leave/scope";
import { db } from "@/lib/db";
import {
  leaveCancellations,
  leavePermissions,
  leavePersonSettings,
  leaveRequestFiles,
  leaveRequests,
  leaveYears,
  people,
  schools,
  users,
} from "@/lib/db/schema";

export const PAGE_SIZE = 25;

export type LeaveListRow = {
  id: number;
  personId: string;
  displayName: string;
  schoolName: string | null;
  leaveType: number;
  leaveTypeLabel: string;
  writeAt: string | null;
  leaveStart: string;
  leaveFinish: string;
  leaveTotal: number;
  documentName: string | null;
  fileCount: number;
  firstFileId: number | null;
  commanderGrant: number | null;
  grantStatusLabel: string;
  workflowStatusLabel: string;
  createdAt: Date;
};

export function canMutateOwnLeaveRequest(
  row: Pick<LeaveListRow, "personId" | "commanderGrant">,
  viewerPersonId: string,
): boolean {
  return row.personId === viewerPersonId && row.commanderGrant === null;
}

export type LeaveRequestDetail = {
  id: number;
  personId: string;
  displayName: string;
  schoolId: number | null;
  schoolName: string | null;
  leaveType: number;
  writeAt: string | null;
  because: string | null;
  leaveStart: string;
  leaveFinish: string;
  halfDayPeriod: HalfDayPeriod | null;
  leaveTotal: number;
  contact: string | null;
  contactTel: string | null;
  documentName: string | null;
  noComment: boolean;
  grantPersonSelected: string | null;
  jobPersonId: string | null;
  lastLeaveStart: string | null;
  lastLeaveFinish: string | null;
  lastLeaveTotal: number | null;
  sickAgo: number | null;
  sickThis: number | null;
  sickTotal: number | null;
  privacyAgo: number | null;
  privacyThis: number | null;
  privacyTotal: number | null;
  birthAgo: number | null;
  birthThis: number | null;
  birthTotal: number | null;
  relaxAgo: number | null;
  relaxThis: number | null;
  relaxTotal: number | null;
  relaxCollect: number | null;
  relaxThisYear: number | null;
  officerComment: string | null;
  officerSignPersonId: string | null;
  officerDate: Date | null;
  groupComment: string | null;
  groupSignPersonId: string | null;
  groupDate: Date | null;
  groupComment2: string | null;
  groupSign2PersonId: string | null;
  groupDate2: Date | null;
  commanderGrant: number | null;
  commanderComment: string | null;
  commanderSignPersonId: string | null;
  grantDate: Date | null;
  createdAt: Date;
};

export type LeaveYearRow = {
  id: number;
  budgetYear: number;
  yearActive: boolean;
};

export type LeavePermissionRow = {
  id: number;
  userId: number;
  personId: string;
  p1: number;
  p2: number;
  officerPersonId: string | null;
  displayName: string;
};

function scopeCondition(
  scope: LeaveScope,
  viewerPersonId: string,
): SQL | undefined {
  if (scope.kind === "district") return undefined;
  return or(
    eq(leaveRequests.schoolId, scope.schoolId),
    eq(leaveRequests.personId, viewerPersonId),
  );
}

function buildWhere(
  scope: LeaveScope,
  viewerPersonId: string,
  q: string,
  leaveType: number | null,
  grant: "all" | "pending" | "approved" | "rejected",
) {
  const conditions: (SQL | undefined)[] = [
    scopeCondition(scope, viewerPersonId),
  ];

  if (q.length >= 2) {
    conditions.push(
      or(
        ilike(leaveRequests.personId, `%${q}%`),
        ilike(people.firstName, `%${q}%`),
        ilike(people.lastName, `%${q}%`),
        ilike(people.prefix, `%${q}%`),
        ilike(users.name, `%${q}%`),
      ),
    );
  }

  if (leaveType) conditions.push(eq(leaveRequests.leaveType, leaveType));

  if (grant === "pending") conditions.push(isNull(leaveRequests.commanderGrant));
  if (grant === "approved") conditions.push(eq(leaveRequests.commanderGrant, 1));
  if (grant === "rejected") conditions.push(eq(leaveRequests.commanderGrant, 0));

  const filtered = conditions.filter(Boolean) as SQL[];
  return filtered.length > 0 ? and(...filtered) : undefined;
}

export function parseLeaveListParams(params: {
  page?: string;
  q?: string;
  leaveType?: string;
  grant?: string;
}) {
  const page = Math.max(1, Number(params.page) || 1);
  const q = (params.q ?? "").trim();
  const leaveTypeRaw = Number(params.leaveType);
  const leaveType =
    Number.isFinite(leaveTypeRaw) && isLeaveTypeId(leaveTypeRaw)
      ? leaveTypeRaw
      : null;
  const grant: "all" | "pending" | "approved" | "rejected" =
    params.grant === "pending" ||
    params.grant === "approved" ||
    params.grant === "rejected"
      ? params.grant
      : "all";
  return { page, q, leaveType, grant };
}

export function parseOwnLeaveRegisterParams(params: { page?: string }) {
  return { page: Math.max(1, Number(params.page) || 1) };
}

async function attachLeaveListFileMeta(
  rows: Omit<LeaveListRow, "fileCount" | "firstFileId">[],
): Promise<LeaveListRow[]> {
  if (rows.length === 0) return [];

  const requestIds = rows.map((row) => row.id);
  const files = await db
    .select({
      requestId: leaveRequestFiles.requestId,
      id: leaveRequestFiles.id,
    })
    .from(leaveRequestFiles)
    .where(inArray(leaveRequestFiles.requestId, requestIds))
    .orderBy(asc(leaveRequestFiles.id));

  const fileMeta = new Map<number, { fileCount: number; firstFileId: number }>();
  for (const file of files) {
    const existing = fileMeta.get(file.requestId);
    if (!existing) {
      fileMeta.set(file.requestId, { fileCount: 1, firstFileId: file.id });
    } else {
      existing.fileCount += 1;
    }
  }

  return rows.map((row) => {
    const meta = fileMeta.get(row.id);
    return {
      ...row,
      fileCount: meta?.fileCount ?? 0,
      firstFileId: meta?.firstFileId ?? null,
    };
  });
}

function mapLeaveListRow(row: {
  id: number;
  personId: string;
  prefix: string | null;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  schoolName: string | null;
  leaveType: number;
  writeAt: string | null;
  leaveStart: string;
  leaveFinish: string;
  leaveTotal: number;
  documentName: string | null;
  schoolId: number | null;
  commanderGrant: number | null;
  groupDate: Date | null;
  groupDate2: Date | null;
  createdAt: Date;
}): Omit<LeaveListRow, "fileCount" | "firstFileId"> {
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
    leaveType: row.leaveType,
    leaveTypeLabel: leaveTypeLabel(row.leaveType),
    writeAt: row.writeAt,
    leaveStart: row.leaveStart,
    leaveFinish: row.leaveFinish,
    leaveTotal: row.leaveTotal,
    documentName: row.documentName,
    commanderGrant: row.commanderGrant,
    grantStatusLabel: grantStatusLabel(row.commanderGrant),
    workflowStatusLabel: workflowStatusLabel(workflow),
    createdAt: row.createdAt,
  };
}

export async function resolveLeaveListPage(
  total: number,
  page: number,
): Promise<number> {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Math.min(page, totalPages);
}

export async function countLeaveRequests(
  scope: LeaveScope,
  viewerPersonId: string,
  q: string,
  leaveType: number | null,
  grant: "all" | "pending" | "approved" | "rejected",
): Promise<number> {
  const where = buildWhere(scope, viewerPersonId, q, leaveType, grant);
  const query = db
    .select({ total: count() })
    .from(leaveRequests)
    .leftJoin(people, eq(people.personId, leaveRequests.personId))
    .leftJoin(users, eq(users.personId, leaveRequests.personId));

  const [row] = where ? await query.where(where) : await query;
  return Number(row?.total ?? 0);
}

export async function countOwnLeaveRequests(
  viewerPersonId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(leaveRequests)
    .where(eq(leaveRequests.personId, viewerPersonId));
  return Number(row?.total ?? 0);
}

export async function listOwnLeaveRequestsPage(input: {
  viewerPersonId: string;
  page: number;
}): Promise<LeaveListRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;

  const rows = await db
    .select({
      id: leaveRequests.id,
      personId: leaveRequests.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
      schoolName: schools.name,
      leaveType: leaveRequests.leaveType,
      writeAt: leaveRequests.writeAt,
      leaveStart: leaveRequests.leaveStart,
      leaveFinish: leaveRequests.leaveFinish,
      leaveTotal: leaveRequests.leaveTotal,
      documentName: leaveRequests.documentName,
      commanderGrant: leaveRequests.commanderGrant,
      schoolId: leaveRequests.schoolId,
      groupDate: leaveRequests.groupDate,
      groupDate2: leaveRequests.groupDate2,
      createdAt: leaveRequests.createdAt,
    })
    .from(leaveRequests)
    .leftJoin(people, eq(people.personId, leaveRequests.personId))
    .leftJoin(users, eq(users.personId, leaveRequests.personId))
    .leftJoin(schools, eq(schools.id, leaveRequests.schoolId))
    .where(eq(leaveRequests.personId, input.viewerPersonId))
    .orderBy(desc(leaveRequests.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  return attachLeaveListFileMeta(rows.map(mapLeaveListRow));
}

export async function listLeaveRequestsPage(input: {
  scope: LeaveScope;
  viewerPersonId: string;
  page: number;
  q: string;
  leaveType: number | null;
  grant: "all" | "pending" | "approved" | "rejected";
}): Promise<LeaveListRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const where = buildWhere(
    input.scope,
    input.viewerPersonId,
    input.q,
    input.leaveType,
    input.grant,
  );

  const base = db
    .select({
      id: leaveRequests.id,
      personId: leaveRequests.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
      schoolName: schools.name,
      leaveType: leaveRequests.leaveType,
      writeAt: leaveRequests.writeAt,
      leaveStart: leaveRequests.leaveStart,
      leaveFinish: leaveRequests.leaveFinish,
      leaveTotal: leaveRequests.leaveTotal,
      documentName: leaveRequests.documentName,
      commanderGrant: leaveRequests.commanderGrant,
      schoolId: leaveRequests.schoolId,
      groupDate: leaveRequests.groupDate,
      groupDate2: leaveRequests.groupDate2,
      createdAt: leaveRequests.createdAt,
    })
    .from(leaveRequests)
    .leftJoin(people, eq(people.personId, leaveRequests.personId))
    .leftJoin(users, eq(users.personId, leaveRequests.personId))
    .leftJoin(schools, eq(schools.id, leaveRequests.schoolId))
    .orderBy(desc(leaveRequests.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const rows = where ? await base.where(where) : await base;

  return attachLeaveListFileMeta(rows.map(mapLeaveListRow));
}

export async function getLeaveRequest(id: number): Promise<LeaveRequestDetail | null> {
  const [row] = await db
    .select({
      id: leaveRequests.id,
      personId: leaveRequests.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
      schoolId: leaveRequests.schoolId,
      schoolName: schools.name,
      leaveType: leaveRequests.leaveType,
      writeAt: leaveRequests.writeAt,
      because: leaveRequests.because,
      leaveStart: leaveRequests.leaveStart,
      leaveFinish: leaveRequests.leaveFinish,
      halfDayPeriod: leaveRequests.halfDayPeriod,
      leaveTotal: leaveRequests.leaveTotal,
      contact: leaveRequests.contact,
      contactTel: leaveRequests.contactTel,
      documentName: leaveRequests.documentName,
      noComment: leaveRequests.noComment,
      grantPersonSelected: leaveRequests.grantPersonSelected,
      jobPersonId: leaveRequests.jobPersonId,
      lastLeaveStart: leaveRequests.lastLeaveStart,
      lastLeaveFinish: leaveRequests.lastLeaveFinish,
      lastLeaveTotal: leaveRequests.lastLeaveTotal,
      sickAgo: leaveRequests.sickAgo,
      sickThis: leaveRequests.sickThis,
      sickTotal: leaveRequests.sickTotal,
      privacyAgo: leaveRequests.privacyAgo,
      privacyThis: leaveRequests.privacyThis,
      privacyTotal: leaveRequests.privacyTotal,
      birthAgo: leaveRequests.birthAgo,
      birthThis: leaveRequests.birthThis,
      birthTotal: leaveRequests.birthTotal,
      relaxAgo: leaveRequests.relaxAgo,
      relaxThis: leaveRequests.relaxThis,
      relaxTotal: leaveRequests.relaxTotal,
      relaxCollect: leaveRequests.relaxCollect,
      relaxThisYear: leaveRequests.relaxThisYear,
      officerComment: leaveRequests.officerComment,
      officerSignPersonId: leaveRequests.officerSignPersonId,
      officerDate: leaveRequests.officerDate,
      groupComment: leaveRequests.groupComment,
      groupSignPersonId: leaveRequests.groupSignPersonId,
      groupDate: leaveRequests.groupDate,
      groupComment2: leaveRequests.groupComment2,
      groupSign2PersonId: leaveRequests.groupSign2PersonId,
      groupDate2: leaveRequests.groupDate2,
      commanderGrant: leaveRequests.commanderGrant,
      commanderComment: leaveRequests.commanderComment,
      commanderSignPersonId: leaveRequests.commanderSignPersonId,
      grantDate: leaveRequests.grantDate,
      createdAt: leaveRequests.createdAt,
    })
    .from(leaveRequests)
    .leftJoin(people, eq(people.personId, leaveRequests.personId))
    .leftJoin(users, eq(users.personId, leaveRequests.personId))
    .leftJoin(schools, eq(schools.id, leaveRequests.schoolId))
    .where(eq(leaveRequests.id, id))
    .limit(1);

  if (!row) return null;

  const halfDay =
    row.halfDayPeriod === "morning" || row.halfDayPeriod === "afternoon"
      ? row.halfDayPeriod
      : null;

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
    schoolId: row.schoolId,
    schoolName: row.schoolName,
    leaveType: row.leaveType,
    writeAt: row.writeAt,
    because: row.because,
    leaveStart: row.leaveStart,
    leaveFinish: row.leaveFinish,
    halfDayPeriod: halfDay,
    leaveTotal: row.leaveTotal,
    contact: row.contact,
    contactTel: row.contactTel,
    documentName: row.documentName,
    noComment: row.noComment,
    grantPersonSelected: row.grantPersonSelected,
    jobPersonId: row.jobPersonId,
    lastLeaveStart: row.lastLeaveStart,
    lastLeaveFinish: row.lastLeaveFinish,
    lastLeaveTotal: row.lastLeaveTotal,
    sickAgo: row.sickAgo,
    sickThis: row.sickThis,
    sickTotal: row.sickTotal,
    privacyAgo: row.privacyAgo,
    privacyThis: row.privacyThis,
    privacyTotal: row.privacyTotal,
    birthAgo: row.birthAgo,
    birthThis: row.birthThis,
    birthTotal: row.birthTotal,
    relaxAgo: row.relaxAgo,
    relaxThis: row.relaxThis,
    relaxTotal: row.relaxTotal,
    relaxCollect: row.relaxCollect,
    relaxThisYear: row.relaxThisYear,
    officerComment: row.officerComment,
    officerSignPersonId: row.officerSignPersonId,
    officerDate: row.officerDate,
    groupComment: row.groupComment,
    groupSignPersonId: row.groupSignPersonId,
    groupDate: row.groupDate,
    groupComment2: row.groupComment2,
    groupSign2PersonId: row.groupSign2PersonId,
    groupDate2: row.groupDate2,
    commanderGrant: row.commanderGrant,
    commanderComment: row.commanderComment,
    commanderSignPersonId: row.commanderSignPersonId,
    grantDate: row.grantDate,
    createdAt: row.createdAt,
  };
}

export function canViewLeaveRequest(
  request: LeaveRequestDetail,
  scope: LeaveScope,
  viewerPersonId: string,
): boolean {
  if (scope.kind === "district") return true;
  if (request.personId === viewerPersonId) return true;
  return request.schoolId === scope.schoolId;
}

export async function listLeaveYears(): Promise<LeaveYearRow[]> {
  return db
    .select({
      id: leaveYears.id,
      budgetYear: leaveYears.budgetYear,
      yearActive: leaveYears.yearActive,
    })
    .from(leaveYears)
    .orderBy(asc(leaveYears.budgetYear));
}

export async function getLeaveYear(id: number) {
  const [row] = await db
    .select()
    .from(leaveYears)
    .where(eq(leaveYears.id, id))
    .limit(1);
  return row ?? null;
}

export async function getActiveLeaveYear() {
  const [row] = await db
    .select()
    .from(leaveYears)
    .where(eq(leaveYears.yearActive, true))
    .limit(1);
  return row ?? null;
}

export async function listLeavePermissions(): Promise<LeavePermissionRow[]> {
  return listLeavePermissionsFiltered();
}

export async function listLeaveStaffPermissions(): Promise<LeavePermissionRow[]> {
  return listLeavePermissionsFiltered({ p1: 1 });
}

async function listLeavePermissionsFiltered(filters?: {
  p1?: number;
  p2?: number;
}): Promise<LeavePermissionRow[]> {
  const conditions = [eq(users.organizationType, "district")];
  if (filters?.p1 !== undefined) {
    conditions.push(eq(leavePermissions.p1, filters.p1));
  }
  if (filters?.p2 !== undefined) {
    conditions.push(eq(leavePermissions.p2, filters.p2));
  }

  const rows = await db
    .select({
      id: leavePermissions.id,
      userId: leavePermissions.userId,
      personId: users.personId,
      p1: leavePermissions.p1,
      p2: leavePermissions.p2,
      officerPersonId: leavePermissions.officerPersonId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(leavePermissions)
    .innerJoin(users, eq(leavePermissions.userId, users.id))
    .leftJoin(
      people,
      and(
        eq(people.personId, users.personId),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .where(and(...conditions))
    .orderBy(asc(leavePermissions.id));

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

export async function getLeaveModulePermission(id: number) {
  const rows = await listLeavePermissions();
  return rows.find((r) => r.id === id) ?? null;
}

export type DistrictStaffOption = {
  userId: number;
  personId: string;
  label: string;
};

export async function listDistrictStaffForLeavePicker(
  excludeUserId?: number,
): Promise<DistrictStaffOption[]> {
  const existing = await db
    .select({ userId: leavePermissions.userId })
    .from(leavePermissions);

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

export async function getLeavePermissionByUserId(userId: number) {
  const [row] = await db
    .select()
    .from(leavePermissions)
    .where(eq(leavePermissions.userId, userId))
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

export async function getPersonSex(
  personId: string,
): Promise<"1" | "2" | null> {
  const [row] = await db
    .select({ sex: people.sex })
    .from(people)
    .where(eq(people.personId, personId))
    .limit(1);
  const sex = row?.sex;
  if (sex === "1" || sex === "2") return sex;
  return null;
}

export async function getLeavePersonSettings(personId: string) {
  const [row] = await db
    .select({
      officerPersonId: leavePersonSettings.officerPersonId,
      commentPersonId: leavePersonSettings.commentPersonId,
      commentPerson2Id: leavePersonSettings.commentPerson2Id,
      grantPersonId: leavePersonSettings.grantPersonId,
    })
    .from(leavePersonSettings)
    .where(eq(leavePersonSettings.personId, personId))
    .limit(1);

  return {
    officerPersonId: row?.officerPersonId ?? null,
    commentPersonId: row?.commentPersonId ?? null,
    commentPerson2Id: row?.commentPerson2Id ?? null,
    grantPersonId: row?.grantPersonId ?? null,
  };
}

export type LeaveRequestFileRow = {
  id: number;
  fileName: string;
  fileDes: string | null;
  fileSize: number | null;
};

export async function listLeaveRequestFiles(
  requestId: number,
): Promise<LeaveRequestFileRow[]> {
  return db
    .select({
      id: leaveRequestFiles.id,
      fileName: leaveRequestFiles.fileName,
      fileDes: leaveRequestFiles.fileDes,
      fileSize: leaveRequestFiles.fileSize,
    })
    .from(leaveRequestFiles)
    .where(eq(leaveRequestFiles.requestId, requestId))
    .orderBy(asc(leaveRequestFiles.id));
}

export type LeaveCancellationListRow = {
  id: number;
  personId: string;
  displayName: string;
  schoolName: string | null;
  leaveType: number;
  leaveTypeLabel: string;
  permissionStart: string;
  permissionFinish: string;
  cancelStart: string;
  cancelFinish: string;
  cancelTotal: number;
  commanderGrant: number | null;
  grantStatusLabel: string;
  workflowStatusLabel: string;
  createdAt: Date;
};

export type LeaveCancellationDetail = {
  id: number;
  personId: string;
  displayName: string;
  sourceRequestId: number;
  schoolId: number | null;
  schoolName: string | null;
  leaveType: number;
  writeAt: string | null;
  permissionStart: string;
  permissionFinish: string;
  permissionTotal: number;
  because: string;
  cancelStart: string;
  cancelFinish: string;
  cancelTotal: number;
  noComment: boolean;
  grantPersonSelected: string | null;
  officerComment: string | null;
  officerSignPersonId: string | null;
  officerDate: Date | null;
  groupComment: string | null;
  groupSignPersonId: string | null;
  groupDate: Date | null;
  commanderGrant: number | null;
  commanderComment: string | null;
  commanderSignPersonId: string | null;
  grantDate: Date | null;
  createdAt: Date;
};

export type EligibleLeaveForCancellation = {
  id: number;
  leaveType: number;
  leaveTypeLabel: string;
  leaveStart: string;
  leaveFinish: string;
  leaveTotal: number;
};

function cancellationScopeCondition(
  scope: LeaveScope,
  viewerPersonId: string,
): SQL | undefined {
  if (scope.kind === "district") return undefined;
  return or(
    eq(leaveRequests.schoolId, scope.schoolId),
    eq(leaveCancellations.personId, viewerPersonId),
  );
}

function buildCancellationWhere(
  scope: LeaveScope,
  viewerPersonId: string,
  q: string,
  leaveType: number | null,
  grant: "all" | "pending" | "approved" | "rejected",
) {
  const conditions: (SQL | undefined)[] = [
    cancellationScopeCondition(scope, viewerPersonId),
  ];

  if (q.length >= 2) {
    conditions.push(
      or(
        ilike(leaveCancellations.personId, `%${q}%`),
        ilike(people.firstName, `%${q}%`),
        ilike(people.lastName, `%${q}%`),
        ilike(people.prefix, `%${q}%`),
      ),
    );
  }

  if (leaveType) conditions.push(eq(leaveCancellations.leaveType, leaveType));

  if (grant === "pending") {
    conditions.push(isNull(leaveCancellations.commanderGrant));
  }
  if (grant === "approved") {
    conditions.push(eq(leaveCancellations.commanderGrant, 1));
  }
  if (grant === "rejected") {
    conditions.push(eq(leaveCancellations.commanderGrant, 0));
  }

  const filtered = conditions.filter(Boolean) as SQL[];
  return filtered.length > 0 ? and(...filtered) : undefined;
}

export async function countLeaveCancellations(
  scope: LeaveScope,
  viewerPersonId: string,
  q: string,
  leaveType: number | null,
  grant: "all" | "pending" | "approved" | "rejected",
): Promise<number> {
  const where = buildCancellationWhere(
    scope,
    viewerPersonId,
    q,
    leaveType,
    grant,
  );
  const query = db
    .select({ total: count() })
    .from(leaveCancellations)
    .innerJoin(
      leaveRequests,
      eq(leaveRequests.id, leaveCancellations.sourceRequestId),
    )
    .leftJoin(people, eq(people.personId, leaveCancellations.personId));

  const [row] = where ? await query.where(where) : await query;
  return Number(row?.total ?? 0);
}

export async function listLeaveCancellationsPage(input: {
  scope: LeaveScope;
  viewerPersonId: string;
  page: number;
  q: string;
  leaveType: number | null;
  grant: "all" | "pending" | "approved" | "rejected";
}): Promise<LeaveCancellationListRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const where = buildCancellationWhere(
    input.scope,
    input.viewerPersonId,
    input.q,
    input.leaveType,
    input.grant,
  );

  const base = db
    .select({
      id: leaveCancellations.id,
      personId: leaveCancellations.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      schoolName: schools.name,
      leaveType: leaveCancellations.leaveType,
      permissionStart: leaveCancellations.permissionStart,
      permissionFinish: leaveCancellations.permissionFinish,
      cancelStart: leaveCancellations.cancelStart,
      cancelFinish: leaveCancellations.cancelFinish,
      cancelTotal: leaveCancellations.cancelTotal,
      commanderGrant: leaveCancellations.commanderGrant,
      schoolId: leaveRequests.schoolId,
      groupDate: leaveCancellations.groupDate,
      createdAt: leaveCancellations.createdAt,
    })
    .from(leaveCancellations)
    .innerJoin(
      leaveRequests,
      eq(leaveRequests.id, leaveCancellations.sourceRequestId),
    )
    .leftJoin(people, eq(people.personId, leaveCancellations.personId))
    .leftJoin(schools, eq(schools.id, leaveRequests.schoolId))
    .orderBy(desc(leaveCancellations.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const rows = where ? await base.where(where) : await base;

  return rows.map((row) => {
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
        userName: null,
        personId: row.personId,
      }),
      schoolName: row.schoolName,
      leaveType: row.leaveType,
      leaveTypeLabel: leaveTypeLabel(row.leaveType),
      permissionStart: row.permissionStart,
      permissionFinish: row.permissionFinish,
      cancelStart: row.cancelStart,
      cancelFinish: row.cancelFinish,
      cancelTotal: row.cancelTotal,
      commanderGrant: row.commanderGrant,
      grantStatusLabel: grantStatusLabel(row.commanderGrant),
      workflowStatusLabel: workflowStatusLabel(workflow),
      createdAt: row.createdAt,
    };
  });
}

export async function getLeaveCancellation(
  id: number,
): Promise<LeaveCancellationDetail | null> {
  const [row] = await db
    .select({
      id: leaveCancellations.id,
      personId: leaveCancellations.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      sourceRequestId: leaveCancellations.sourceRequestId,
      schoolId: leaveRequests.schoolId,
      schoolName: schools.name,
      leaveType: leaveCancellations.leaveType,
      writeAt: leaveCancellations.writeAt,
      permissionStart: leaveCancellations.permissionStart,
      permissionFinish: leaveCancellations.permissionFinish,
      permissionTotal: leaveCancellations.permissionTotal,
      because: leaveCancellations.because,
      cancelStart: leaveCancellations.cancelStart,
      cancelFinish: leaveCancellations.cancelFinish,
      cancelTotal: leaveCancellations.cancelTotal,
      noComment: leaveCancellations.noComment,
      grantPersonSelected: leaveCancellations.grantPersonSelected,
      officerComment: leaveCancellations.officerComment,
      officerSignPersonId: leaveCancellations.officerSignPersonId,
      officerDate: leaveCancellations.officerDate,
      groupComment: leaveCancellations.groupComment,
      groupSignPersonId: leaveCancellations.groupSignPersonId,
      groupDate: leaveCancellations.groupDate,
      commanderGrant: leaveCancellations.commanderGrant,
      commanderComment: leaveCancellations.commanderComment,
      commanderSignPersonId: leaveCancellations.commanderSignPersonId,
      grantDate: leaveCancellations.grantDate,
      createdAt: leaveCancellations.createdAt,
    })
    .from(leaveCancellations)
    .innerJoin(
      leaveRequests,
      eq(leaveRequests.id, leaveCancellations.sourceRequestId),
    )
    .leftJoin(people, eq(people.personId, leaveCancellations.personId))
    .leftJoin(schools, eq(schools.id, leaveRequests.schoolId))
    .where(eq(leaveCancellations.id, id))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    personId: row.personId,
    displayName: formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      fallback: row.personId,
    }),
    sourceRequestId: row.sourceRequestId,
    schoolId: row.schoolId,
    schoolName: row.schoolName,
    leaveType: row.leaveType,
    writeAt: row.writeAt,
    permissionStart: row.permissionStart,
    permissionFinish: row.permissionFinish,
    permissionTotal: row.permissionTotal,
    because: row.because,
    cancelStart: row.cancelStart,
    cancelFinish: row.cancelFinish,
    cancelTotal: row.cancelTotal,
    noComment: row.noComment,
    grantPersonSelected: row.grantPersonSelected,
    officerComment: row.officerComment,
    officerSignPersonId: row.officerSignPersonId,
    officerDate: row.officerDate,
    groupComment: row.groupComment,
    groupSignPersonId: row.groupSignPersonId,
    groupDate: row.groupDate,
    commanderGrant: row.commanderGrant,
    commanderComment: row.commanderComment,
    commanderSignPersonId: row.commanderSignPersonId,
    grantDate: row.grantDate,
    createdAt: row.createdAt,
  };
}

export function canViewLeaveCancellation(
  cancellation: LeaveCancellationDetail,
  scope: LeaveScope,
  viewerPersonId: string,
): boolean {
  if (scope.kind === "district") return true;
  if (cancellation.personId === viewerPersonId) return true;
  return cancellation.schoolId === scope.schoolId;
}

export async function getLeaveCancellationBySourceRequestId(
  sourceRequestId: number,
): Promise<{ id: number; commanderGrant: number | null } | null> {
  const [row] = await db
    .select({
      id: leaveCancellations.id,
      commanderGrant: leaveCancellations.commanderGrant,
    })
    .from(leaveCancellations)
    .where(eq(leaveCancellations.sourceRequestId, sourceRequestId))
    .limit(1);
  return row ?? null;
}

export async function listEligibleLeaveRequestsForCancellation(
  personId: string,
): Promise<EligibleLeaveForCancellation[]> {
  const rows = await db
    .select({
      id: leaveRequests.id,
      leaveType: leaveRequests.leaveType,
      leaveStart: leaveRequests.leaveStart,
      leaveFinish: leaveRequests.leaveFinish,
      leaveTotal: leaveRequests.leaveTotal,
    })
    .from(leaveRequests)
    .leftJoin(
      leaveCancellations,
      eq(leaveCancellations.sourceRequestId, leaveRequests.id),
    )
    .where(
      and(
        eq(leaveRequests.personId, personId),
        eq(leaveRequests.commanderGrant, 1),
        isNull(leaveCancellations.id),
      ),
    )
    .orderBy(desc(leaveRequests.leaveStart));

  return rows.map((row) => ({
    id: row.id,
    leaveType: row.leaveType,
    leaveTypeLabel: leaveTypeLabel(row.leaveType),
    leaveStart: row.leaveStart,
    leaveFinish: row.leaveFinish,
    leaveTotal: row.leaveTotal,
  }));
}

/** @deprecated */
export const parseLaListParams = parseLeaveListParams;
export const resolveLaListPage = resolveLeaveListPage;
export const countLaRequests = countLeaveRequests;
export const listLaRequestsPage = listLeaveRequestsPage;
export const getLaRequest = getLeaveRequest;
export const canViewLaRequest = canViewLeaveRequest;
export const getLaYear = getLeaveYear;
export const getActiveLaYear = getActiveLeaveYear;
export const getLaModulePermission = getLeaveModulePermission;
export const getLaPermissionByUserId = getLeavePermissionByUserId;
