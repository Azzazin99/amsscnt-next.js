import {
  and,
  count,
  desc,
  eq,
  like,
  isNull,
  max,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { registerCertificates, users } from "@/lib/db/schema";
import type { BookregisterPermissionFlags } from "@/lib/bookregister/permissions";
import {
  canDeleteCommandRecord,
  canEditCommandRecord,
} from "@/lib/bookregister/permissions";
import { getActiveDistrictYear } from "@/lib/bookregister/years/queries";
import type { AmssSessionUser } from "@/types/next-auth";
import type { RegisterListVisibility } from "@/lib/bookregister/list-visibility";

export const CERTIFICATE_PAGE_SIZE = 15;

export type CertificateRowActionContext = {
  user: AmssSessionUser;
  canWrite: boolean;
  canDeletePerm: boolean;
  perms: BookregisterPermissionFlags;
};

export type CertificateListFilters = {
  q?: string;
};

export type DistrictCertificateRow = {
  id: number;
  year: number;
  registerNumber: number;
  bookNo: string | null;
  signdate: string | null;
  subject: string | null;
  comment: string | null;
  registerDate: string | null;
  refId: string;
  officerId: number | null;
  officerName: string | null;
  fileName: string | null;
  urgencyLevel: number;
  secretLevel: number;
  hasAttachment: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

function buildSearchCondition(q: string | undefined) {
  const term = q?.trim() ?? "";
  if (!term) return undefined;

  const pattern = `%${term}%`;
  const parts = [
    like(registerCertificates.subject, pattern),
    like(registerCertificates.bookNo, pattern),
    like(registerCertificates.comment, pattern),
    sql`CAST(${registerCertificates.registerNumber} AS CHAR) LIKE ${pattern}`,
  ];

  // รองรับรูปแบบ "เลข/ปี"
  const slash = term.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (slash) {
    const registerNumber = Number(slash[1]);
    const year = Number(slash[2]);
    if (Number.isFinite(registerNumber) && Number.isFinite(year)) {
      parts.push(
        and(
          eq(registerCertificates.registerNumber, registerNumber),
          eq(registerCertificates.year, year),
        )!,
      );
    }
  } else if (/^\d+$/.test(term)) {
    const registerNumber = Number(term);
    if (Number.isFinite(registerNumber)) {
      parts.push(eq(registerCertificates.registerNumber, registerNumber));
    }
  }

  return or(...parts);
}

function buildWhere(
  filters: CertificateListFilters,
  visibility?: RegisterListVisibility,
) {
  const conditions = [
    isNull(registerCertificates.schoolId),
    isNull(registerCertificates.deletedAt),
  ];

  const search = buildSearchCondition(filters.q);
  if (search) conditions.push(search);

  if (visibility && !visibility.canViewSecret) {
    conditions.push(eq(registerCertificates.secretLevel, 0));
  }

  return and(...conditions);
}

export async function countDistrictCertificates(
  filters: CertificateListFilters,
  visibility?: RegisterListVisibility,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(registerCertificates)
    .where(buildWhere(filters, visibility));

  return row?.total ?? 0;
}

export async function listDistrictCertificates(
  filters: CertificateListFilters,
  page: number,
  pageSize = CERTIFICATE_PAGE_SIZE,
  actionContext?: CertificateRowActionContext,
  visibility?: RegisterListVisibility,
): Promise<DistrictCertificateRow[]> {
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      id: registerCertificates.id,
      year: registerCertificates.year,
      registerNumber: registerCertificates.registerNumber,
      bookNo: registerCertificates.bookNo,
      signdate: registerCertificates.signdate,
      subject: registerCertificates.subject,
      comment: registerCertificates.comment,
      registerDate: registerCertificates.registerDate,
      refId: registerCertificates.refId,
      officerId: registerCertificates.officerId,
      fileName: registerCertificates.fileName,
      officerName: users.name,
      urgencyLevel: registerCertificates.urgencyLevel,
      secretLevel: registerCertificates.secretLevel,
    })
    .from(registerCertificates)
    .leftJoin(users, eq(registerCertificates.officerId, users.id))
    .where(buildWhere(filters, visibility))
    .orderBy(desc(registerCertificates.year), desc(registerCertificates.registerNumber))
    .limit(pageSize)
    .offset(offset);

  return rows.map((row) => {
    const canEdit =
      actionContext &&
      canEditCommandRecord(
        actionContext.user,
        actionContext.perms,
        row.officerId,
        row.registerDate,
      );

    const canDelete =
      actionContext &&
      canDeleteCommandRecord(
        actionContext.user,
        actionContext.perms,
        row.officerId,
        row.registerDate,
      );

    return {
      ...row,
      hasAttachment: Boolean(row.fileName),
      canEdit: Boolean(canEdit && actionContext?.canWrite),
      canDelete: Boolean(
        canDelete && actionContext?.canDeletePerm,
      ),
    };
  });
}

export async function allocateNextCertificateNumber(year: number) {
  const activeYear = await getActiveDistrictYear();
  if (!activeYear || activeYear.year !== year) {
    throw new Error("ปีทะเบียนไม่ตรงกับปีปัจจุบัน");
  }

  const [row] = await db
    .select({ numberMax: max(registerCertificates.registerNumber) })
    .from(registerCertificates)
    .where(
      and(
        eq(registerCertificates.year, year),
        isNull(registerCertificates.schoolId),
        isNull(registerCertificates.deletedAt),
      ),
    );

  const maxNum = row?.numberMax ?? 0;
  if (maxNum < activeYear.startCertificateNum) {
    return activeYear.startCertificateNum;
  }
  return maxNum + 1;
}

export async function getDistrictCertificate(id: number) {
  const [row] = await db
    .select({
      id: registerCertificates.id,
      year: registerCertificates.year,
      registerNumber: registerCertificates.registerNumber,
      bookNo: registerCertificates.bookNo,
      signdate: registerCertificates.signdate,
      subject: registerCertificates.subject,
      comment: registerCertificates.comment,
      registerDate: registerCertificates.registerDate,
      refId: registerCertificates.refId,
      officerId: registerCertificates.officerId,
      officerName: users.name,
      fileName: registerCertificates.fileName,
      urgencyLevel: registerCertificates.urgencyLevel,
      secretLevel: registerCertificates.secretLevel,
    })
    .from(registerCertificates)
    .leftJoin(users, eq(registerCertificates.officerId, users.id))
    .where(
      and(
        eq(registerCertificates.id, id),
        isNull(registerCertificates.schoolId),
        isNull(registerCertificates.deletedAt),
      ),
    )
    .limit(1);

  if (!row) return null;

  return {
    ...row,
    hasAttachment: Boolean(row.fileName),
  };
}

