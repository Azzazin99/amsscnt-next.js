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
  districtSettings,
  registerOfficeNumbers,
  registerSendFiles,
  registerSends,
  workgroups,
} from "@/lib/db/schema";
import type { RegisterListVisibility } from "@/lib/bookregister/list-visibility";
import type { BookregisterScope } from "@/lib/bookregister/scope";
import { scopeSendSchoolCondition } from "@/lib/bookregister/scope";
import { getActiveRegisterYear } from "@/lib/bookregister/years/queries";
import { buildRegisterListSearchCondition } from "@/lib/bookregister/build-register-list-search";
import { isWithinSendModifyWindow } from "@/lib/bookregister/permissions";

export const SEND_PAGE_SIZE = 15;

export type SendRowActionContext = {
  userId: number;
  canWrite: boolean;
  canDeletePerm: boolean;
  isModuleAdmin: boolean;
};

export type SendListFilters = {
  q?: string;
  workgroupId?: number;
};

export type DistrictSendRow = {
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
  officeType: number;
  forwardedToSchools: boolean;
  hasAttachment: boolean;
  urgencyLevel: number;
  canEdit: boolean;
  canDelete: boolean;
};

function buildWhere(
  scope: BookregisterScope,
  filters: SendListFilters,
  visibility?: RegisterListVisibility,
) {
  const conditions = [
    scopeSendSchoolCondition(scope),
    isNull(registerSends.deletedAt),
  ];

  const search = buildRegisterListSearchCondition(registerSends, filters.q);
  if (search) conditions.push(search);

  if (filters.workgroupId) {
    conditions.push(eq(registerSends.workgroupId, filters.workgroupId));
  }

  if (visibility && !visibility.canViewSecret) {
    conditions.push(eq(registerSends.secretLevel, 0));
  }

  return and(...conditions);
}

export async function countDistrictSends(
  scope: BookregisterScope,
  filters: SendListFilters,
  visibility?: RegisterListVisibility,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(registerSends)
    .where(buildWhere(scope, filters, visibility));

  return row?.total ?? 0;
}

export async function listDistrictSends(
  scope: BookregisterScope,
  filters: SendListFilters,
  page: number,
  pageSize = SEND_PAGE_SIZE,
  actionContext?: SendRowActionContext,
  visibility?: RegisterListVisibility,
): Promise<DistrictSendRow[]> {
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      id: registerSends.id,
      year: registerSends.year,
      registerNumber: registerSends.registerNumber,
      bookNo: registerSends.bookNo,
      signdate: registerSends.signdate,
      bookFrom: registerSends.bookFrom,
      bookTo: registerSends.bookTo,
      subject: registerSends.subject,
      operation: registerSends.operation,
      comment: registerSends.comment,
      registerDate: registerSends.registerDate,
      refId: registerSends.refId,
      secret: registerSends.secret,
      secretLevel: registerSends.secretLevel,
      urgencyLevel: registerSends.urgencyLevel,
      workgroupId: registerSends.workgroupId,
      officerId: registerSends.officerId,
      officeType: registerSends.officeType,
      forwardedToSchools: registerSends.forwardedToSchools,
      workgroupName: workgroups.name,
    })
    .from(registerSends)
    .leftJoin(workgroups, eq(registerSends.workgroupId, workgroups.id))
    .where(buildWhere(scope, filters, visibility))
    .orderBy(desc(registerSends.year), desc(registerSends.registerNumber))
    .limit(pageSize)
    .offset(offset);

  const refIds = rows.map((r) => r.refId);
  const attachmentSet = new Set<string>();

  if (refIds.length > 0) {
    const fileRows = await db
      .select({ refId: registerSendFiles.refId })
      .from(registerSendFiles)
      .where(inArray(registerSendFiles.refId, refIds))
      .groupBy(registerSendFiles.refId);

    for (const f of fileRows) {
      attachmentSet.add(f.refId);
    }
  }

  return rows.map((row) => {
    const canModify =
      actionContext &&
      isWithinSendModifyWindow(row.registerDate) &&
      (actionContext.isModuleAdmin || row.officerId === actionContext.userId);

    return {
      ...row,
      hasAttachment: attachmentSet.has(row.refId),
      urgencyLevel: row.urgencyLevel,
      canEdit: Boolean(canModify && actionContext?.canWrite),
      canDelete: Boolean(canModify && actionContext?.canDeletePerm),
    };
  });
}

export async function getDistrictOfficeName(): Promise<string> {
  const [row] = await db
    .select({ officeName: districtSettings.officeName })
    .from(districtSettings)
    .orderBy(asc(districtSettings.id))
    .limit(1);

  return row?.officeName ?? "";
}

/** prefix เลขที่หนังสือออกของเขต เช่น "ที่ ศธ 04146/" */
export async function getDistrictOfficeNo(): Promise<string> {
  const [row] = await db
    .select({ officeNo: registerOfficeNumbers.officeNo })
    .from(registerOfficeNumbers)
    .where(isNull(registerOfficeNumbers.schoolCode))
    .orderBy(asc(registerOfficeNumbers.id))
    .limit(1);

  return row?.officeNo ?? "";
}

export async function allocateNextSendNumber(
  scope: BookregisterScope,
  year: number,
) {
  const activeYear = await getActiveRegisterYear(scope);
  if (!activeYear || activeYear.year !== year) {
    throw new Error("ปีทะเบียนไม่ตรงกับปีปัจจุบัน");
  }

  const [row] = await db
    .select({ numberMax: max(registerSends.registerNumber) })
    .from(registerSends)
    .where(
      and(
        eq(registerSends.year, year),
        scopeSendSchoolCondition(scope),
        isNull(registerSends.deletedAt),
      ),
    );

  const maxNum = row?.numberMax ?? 0;
  if (maxNum < activeYear.startSendNum) {
    return activeYear.startSendNum;
  }
  return maxNum + 1;
}

export async function getDistrictSend(id: number, scope: BookregisterScope) {
  const [row] = await db
    .select({
      id: registerSends.id,
      year: registerSends.year,
      registerNumber: registerSends.registerNumber,
      bookNo: registerSends.bookNo,
      signdate: registerSends.signdate,
      bookFrom: registerSends.bookFrom,
      bookTo: registerSends.bookTo,
      subject: registerSends.subject,
      operation: registerSends.operation,
      comment: registerSends.comment,
      registerDate: registerSends.registerDate,
      refId: registerSends.refId,
      secret: registerSends.secret,
      secretLevel: registerSends.secretLevel,
      urgencyLevel: registerSends.urgencyLevel,
      workgroupId: registerSends.workgroupId,
      officerId: registerSends.officerId,
      officeType: registerSends.officeType,
      forwardedToSchools: registerSends.forwardedToSchools,
      workgroupName: workgroups.name,
    })
    .from(registerSends)
    .leftJoin(workgroups, eq(registerSends.workgroupId, workgroups.id))
    .where(
      and(
        eq(registerSends.id, id),
        scopeSendSchoolCondition(scope),
        isNull(registerSends.deletedAt),
      ),
    )
    .limit(1);

  if (!row) return null;

  const [fileRow] = await db
    .select({ total: count() })
    .from(registerSendFiles)
    .where(eq(registerSendFiles.refId, row.refId));

  return {
    ...row,
    hasAttachment: (fileRow?.total ?? 0) > 0,
  };
}

export async function listDistrictSendFiles(refId: string) {
  return db
    .select({
      id: registerSendFiles.id,
      fileName: registerSendFiles.fileName,
      fileDes: registerSendFiles.fileDes,
    })
    .from(registerSendFiles)
    .where(eq(registerSendFiles.refId, refId))
    .orderBy(asc(registerSendFiles.id));
}
