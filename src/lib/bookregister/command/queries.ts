import { and, count, desc, eq, isNull, max } from "drizzle-orm";
import { db } from "@/lib/db";
import { registerCommands, users } from "@/lib/db/schema";
import { buildCommandListSearchCondition } from "@/lib/bookregister/build-register-list-search";
import {
  canDeleteCommandRecord,
  canEditCommandRecord,
  type BookregisterPermissionFlags,
} from "@/lib/bookregister/permissions";
import { getActiveDistrictYear } from "@/lib/bookregister/years/queries";
import type { AmssSessionUser } from "@/types/next-auth";

export const COMMAND_PAGE_SIZE = 15;

export type CommandRowActionContext = {
  user: AmssSessionUser;
  canWrite: boolean;
  canDeletePerm: boolean;
  perms: BookregisterPermissionFlags;
};

export type CommandListFilters = {
  q?: string;
};

export type DistrictCommandRow = {
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
  hasAttachment: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

function buildWhere(filters: CommandListFilters) {
  const conditions = [
    isNull(registerCommands.schoolId),
    isNull(registerCommands.deletedAt),
  ];

  const search = buildCommandListSearchCondition(registerCommands, filters.q);
  if (search) conditions.push(search);

  return and(...conditions);
}

export async function countDistrictCommands(
  filters: CommandListFilters,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(registerCommands)
    .where(buildWhere(filters));

  return row?.total ?? 0;
}

export async function listDistrictCommands(
  filters: CommandListFilters,
  page: number,
  pageSize = COMMAND_PAGE_SIZE,
  actionContext?: CommandRowActionContext,
): Promise<DistrictCommandRow[]> {
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      id: registerCommands.id,
      year: registerCommands.year,
      registerNumber: registerCommands.registerNumber,
      bookNo: registerCommands.bookNo,
      signdate: registerCommands.signdate,
      subject: registerCommands.subject,
      comment: registerCommands.comment,
      registerDate: registerCommands.registerDate,
      refId: registerCommands.refId,
      officerId: registerCommands.officerId,
      fileName: registerCommands.fileName,
      officerName: users.name,
    })
    .from(registerCommands)
    .leftJoin(users, eq(registerCommands.officerId, users.id))
    .where(buildWhere(filters))
    .orderBy(
      desc(registerCommands.year),
      desc(registerCommands.registerNumber),
    )
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
      canDelete: Boolean(canDelete && actionContext?.canDeletePerm),
    };
  });
}

export async function allocateNextCommandNumber(year: number) {
  const activeYear = await getActiveDistrictYear();
  if (!activeYear || activeYear.year !== year) {
    throw new Error("ปีทะเบียนไม่ตรงกับปีปัจจุบัน");
  }

  const [row] = await db
    .select({ numberMax: max(registerCommands.registerNumber) })
    .from(registerCommands)
    .where(
      and(
        eq(registerCommands.year, year),
        isNull(registerCommands.schoolId),
        isNull(registerCommands.deletedAt),
      ),
    );

  const maxNum = row?.numberMax ?? 0;
  if (maxNum < activeYear.startCommandNum) {
    return activeYear.startCommandNum;
  }
  return maxNum + 1;
}

export async function getDistrictCommand(id: number) {
  const [row] = await db
    .select({
      id: registerCommands.id,
      year: registerCommands.year,
      registerNumber: registerCommands.registerNumber,
      bookNo: registerCommands.bookNo,
      signdate: registerCommands.signdate,
      subject: registerCommands.subject,
      comment: registerCommands.comment,
      registerDate: registerCommands.registerDate,
      refId: registerCommands.refId,
      officerId: registerCommands.officerId,
      fileName: registerCommands.fileName,
      officerName: users.name,
    })
    .from(registerCommands)
    .leftJoin(users, eq(registerCommands.officerId, users.id))
    .where(
      and(
        eq(registerCommands.id, id),
        isNull(registerCommands.schoolId),
        isNull(registerCommands.deletedAt),
      ),
    )
    .limit(1);

  if (!row) return null;

  return {
    ...row,
    hasAttachment: Boolean(row.fileName),
  };
}
