import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
  max,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  registerReceiveFiles,
  registerReceives,
  schools,
  workgroups,
} from "@/lib/db/schema";
import { buildRegisterListSearchCondition } from "@/lib/bookregister/build-register-list-search";
import type { RegisterListVisibility } from "@/lib/bookregister/list-visibility";
import type { BookregisterScope } from "@/lib/bookregister/scope";
import { scopeReceiveSchoolCondition } from "@/lib/bookregister/scope";
import { getActiveRegisterYear } from "@/lib/bookregister/years/queries";
import { isWithinReceiveModifyWindow } from "@/lib/bookregister/permissions";

export const RECEIVE_PAGE_SIZE = 15;

export type ReceiveRowActionContext = {
  userId: number;
  canWrite: boolean;
  canDeletePerm: boolean;
  isModuleAdmin: boolean;
};

export type ReceiveListFilters = {
  q?: string;
  workgroupId?: number;
};

export type DistrictReceiveRow = {
  id: number;
  year: number;
  registerNumber: number;
  bookNo: string | null;
  signdate: string | null;
  bookFrom: string | null;
  bookTo: string | null;
  subject: string | null;
  operation: string | null;
  comment: string | null;
  registerDate: string | null;
  refId: string;
  secret: boolean;
  secretLevel: number;
  workgroupName: string | null;
  workgroupId: number | null;
  officerId: number | null;
  hasAttachment: boolean;
  urgencyLevel: number;
  canEdit: boolean;
  canDelete: boolean;
};

function buildWhere(
  scope: BookregisterScope,
  filters: ReceiveListFilters,
  visibility?: RegisterListVisibility,
) {
  const conditions = [
    scopeReceiveSchoolCondition(scope),
    isNull(registerReceives.deletedAt),
  ];

  const search = buildRegisterListSearchCondition(registerReceives, filters.q);
  if (search) conditions.push(search);

  if (filters.workgroupId) {
    conditions.push(eq(registerReceives.workgroupId, filters.workgroupId));
  }

  if (visibility && !visibility.canViewSecret) {
    conditions.push(eq(registerReceives.secretLevel, 0));
  }

  return and(...conditions);
}

export async function countDistrictReceives(
  scope: BookregisterScope,
  filters: ReceiveListFilters,
  visibility?: RegisterListVisibility,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(registerReceives)
    .where(buildWhere(scope, filters, visibility));

  return row?.total ?? 0;
}

export async function listDistrictReceives(
  scope: BookregisterScope,
  filters: ReceiveListFilters,
  page: number,
  pageSize = RECEIVE_PAGE_SIZE,
  actionContext?: ReceiveRowActionContext,
  visibility?: RegisterListVisibility,
): Promise<DistrictReceiveRow[]> {
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      id: registerReceives.id,
      year: registerReceives.year,
      registerNumber: registerReceives.registerNumber,
      bookNo: registerReceives.bookNo,
      signdate: registerReceives.signdate,
      bookFrom: registerReceives.bookFrom,
      bookTo: registerReceives.bookTo,
      subject: registerReceives.subject,
      operation: registerReceives.operation,
      comment: registerReceives.comment,
      registerDate: registerReceives.registerDate,
      refId: registerReceives.refId,
      secret: registerReceives.secret,
      secretLevel: registerReceives.secretLevel,
      urgencyLevel: registerReceives.urgencyLevel,
      workgroupId: registerReceives.workgroupId,
      officerId: registerReceives.officerId,
      workgroupName: workgroups.name,
    })
    .from(registerReceives)
    .leftJoin(workgroups, eq(registerReceives.workgroupId, workgroups.id))
    .where(buildWhere(scope, filters, visibility))
    .orderBy(desc(registerReceives.year), desc(registerReceives.registerNumber))
    .limit(pageSize)
    .offset(offset);

  const refIds = rows.map((r) => r.refId);
  const attachmentSet = new Set<string>();

  if (refIds.length > 0) {
    const fileRows = await db
      .select({ refId: registerReceiveFiles.refId })
      .from(registerReceiveFiles)
      .where(inArray(registerReceiveFiles.refId, refIds))
      .groupBy(registerReceiveFiles.refId);

    for (const f of fileRows) {
      attachmentSet.add(f.refId);
    }
  }

  return rows.map((row) => {
    const canModify =
      actionContext &&
      isWithinReceiveModifyWindow(row.registerDate) &&
      (actionContext.isModuleAdmin ||
        row.officerId === actionContext.userId);

    return {
      ...row,
      hasAttachment: attachmentSet.has(row.refId),
      urgencyLevel: row.urgencyLevel,
      canEdit: Boolean(canModify && actionContext?.canWrite),
      canDelete: Boolean(canModify && actionContext?.canDeletePerm),
    };
  });
}

export async function getDistrictReceive(
  id: number,
  scope: BookregisterScope,
) {
  const [row] = await db
    .select({
      id: registerReceives.id,
      year: registerReceives.year,
      registerNumber: registerReceives.registerNumber,
      bookNo: registerReceives.bookNo,
      signdate: registerReceives.signdate,
      bookFrom: registerReceives.bookFrom,
      bookTo: registerReceives.bookTo,
      subject: registerReceives.subject,
      operation: registerReceives.operation,
      comment: registerReceives.comment,
      registerDate: registerReceives.registerDate,
      refId: registerReceives.refId,
      secret: registerReceives.secret,
      secretLevel: registerReceives.secretLevel,
      urgencyLevel: registerReceives.urgencyLevel,
      recordType: registerReceives.recordType,
      workgroupId: registerReceives.workgroupId,
      officerId: registerReceives.officerId,
      source: registerReceives.source,
      bookLink: registerReceives.bookLink,
      workgroupName: workgroups.name,
    })
    .from(registerReceives)
    .leftJoin(workgroups, eq(registerReceives.workgroupId, workgroups.id))
    .where(
      and(
        eq(registerReceives.id, id),
        scopeReceiveSchoolCondition(scope),
        isNull(registerReceives.deletedAt),
      ),
    )
    .limit(1);

  if (!row) return null;

  const [fileRow] = await db
    .select({ total: count() })
    .from(registerReceiveFiles)
    .where(eq(registerReceiveFiles.refId, row.refId));

  return {
    ...row,
    hasAttachment: (fileRow?.total ?? 0) > 0,
  };
}

export async function listDistrictReceiveFiles(refId: string) {
  return db
    .select({
      id: registerReceiveFiles.id,
      fileName: registerReceiveFiles.fileName,
      fileDes: registerReceiveFiles.fileDes,
    })
    .from(registerReceiveFiles)
    .where(eq(registerReceiveFiles.refId, refId))
    .orderBy(asc(registerReceiveFiles.id));
}

export async function listSchoolsForSelect() {
  return db
    .select({
      code: schools.schoolCode,
      name: schools.name,
    })
    .from(schools)
    .where(eq(schools.active, true))
    .orderBy(asc(schools.schoolType), asc(schools.schoolCode));
}

export async function getSchoolNameByCode(code: string) {
  const [row] = await db
    .select({ name: schools.name })
    .from(schools)
    .where(eq(schools.schoolCode, code))
    .limit(1);
  return row?.name ?? null;
}

export async function getLastBookNoPrefixForSchool(
  schoolName: string,
): Promise<string> {
  const [row] = await db
    .select({ bookNo: registerReceives.bookNo })
    .from(registerReceives)
    .where(
      and(
        eq(registerReceives.bookFrom, schoolName),
        isNull(registerReceives.schoolId),
        isNull(registerReceives.deletedAt),
      ),
    )
    .orderBy(desc(registerReceives.id))
    .limit(1);

  if (!row?.bookNo) return "";
  const parts = row.bookNo.split("/");
  return parts.length > 1 ? `${parts[0]}/` : "";
}

export async function allocateNextRegisterNumber(
  scope: BookregisterScope,
  year: number,
) {
  const activeYear = await getActiveRegisterYear(scope);
  if (!activeYear || activeYear.year !== year) {
    throw new Error("ปีทะเบียนไม่ตรงกับปีปัจจุบัน");
  }

  const [row] = await db
    .select({ numberMax: max(registerReceives.registerNumber) })
    .from(registerReceives)
    .where(
      and(
        eq(registerReceives.year, year),
        scopeReceiveSchoolCondition(scope),
        isNull(registerReceives.deletedAt),
      ),
    );

  const maxNum = row?.numberMax ?? 0;
  if (maxNum < activeYear.startReceiveNum) {
    return activeYear.startReceiveNum;
  }
  return maxNum + 1;
}

export async function findSchoolCodeByName(name: string) {
  const [row] = await db
    .select({ code: schools.schoolCode })
    .from(schools)
    .where(eq(schools.name, name))
    .limit(1);
  return row?.code ?? null;
}

export async function listWorkgroupsForFilter() {
  return db
    .select({
      id: workgroups.id,
      name: workgroups.name,
    })
    .from(workgroups)
    .where(eq(workgroups.active, true))
    .orderBy(asc(workgroups.sortOrder), asc(workgroups.name));
}
