import { and, asc, count, eq, isNull, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  registerCommands,
  registerReceives,
  registerSends,
  workgroups,
} from "@/lib/db/schema";
import type { RegisterListVisibility } from "@/lib/bookregister/list-visibility";
import {
  scopeReceiveSchoolCondition,
  scopeSendSchoolCondition,
  type BookregisterScope,
} from "@/lib/bookregister/scope";

export type ReceiveReportRow = {
  registerNumber: number;
  year: number;
  bookNo: string | null;
  signdate: string | null;
  bookFrom: string | null;
  bookTo: string | null;
  subject: string | null;
  registerDate: string | null;
  comment: string | null;
  workgroupName: string | null;
  operation: string | null;
  urgencyLevel: number;
  secretLevel: number;
};

export type SendReportRow = ReceiveReportRow & {
  officeType: number;
};

export type CommandReportRow = {
  registerNumber: number;
  year: number;
  bookNo: string | null;
  subject: string | null;
  signdate: string | null;
  comment: string | null;
  registerDate: string | null;
};

function secretLevelFilter(visibility: RegisterListVisibility | undefined) {
  return visibility && !visibility.canViewSecret;
}

function receiveReportConditions(
  scope: BookregisterScope,
  year: number,
  visibility?: RegisterListVisibility,
): SQL[] {
  const conditions = [
    eq(registerReceives.year, year),
    scopeReceiveSchoolCondition(scope),
    isNull(registerReceives.deletedAt),
  ];

  if (secretLevelFilter(visibility)) {
    conditions.push(eq(registerReceives.secretLevel, 0));
  }

  return conditions;
}

function sendReportConditions(
  scope: BookregisterScope,
  year: number,
  visibility?: RegisterListVisibility,
): SQL[] {
  const conditions = [
    eq(registerSends.year, year),
    scopeSendSchoolCondition(scope),
    isNull(registerSends.deletedAt),
  ];

  if (secretLevelFilter(visibility)) {
    conditions.push(eq(registerSends.secretLevel, 0));
  }

  return conditions;
}

function commandReportConditions(year: number): SQL[] {
  return [
    eq(registerCommands.year, year),
    isNull(registerCommands.schoolId),
    isNull(registerCommands.deletedAt),
  ];
}

export async function listReceiveReportRows(
  scope: BookregisterScope,
  year: number,
  visibility?: RegisterListVisibility,
): Promise<ReceiveReportRow[]> {
  return db
    .select({
      registerNumber: registerReceives.registerNumber,
      year: registerReceives.year,
      bookNo: registerReceives.bookNo,
      signdate: registerReceives.signdate,
      bookFrom: registerReceives.bookFrom,
      bookTo: registerReceives.bookTo,
      subject: registerReceives.subject,
      registerDate: registerReceives.registerDate,
      comment: registerReceives.comment,
      workgroupName: workgroups.name,
      operation: registerReceives.operation,
      urgencyLevel: registerReceives.urgencyLevel,
      secretLevel: registerReceives.secretLevel,
    })
    .from(registerReceives)
    .leftJoin(workgroups, eq(registerReceives.workgroupId, workgroups.id))
    .where(and(...receiveReportConditions(scope, year, visibility)))
    .orderBy(asc(registerReceives.registerNumber));
}

export async function listSendReportRows(
  scope: BookregisterScope,
  year: number,
  visibility?: RegisterListVisibility,
): Promise<SendReportRow[]> {
  return db
    .select({
      registerNumber: registerSends.registerNumber,
      year: registerSends.year,
      bookNo: registerSends.bookNo,
      signdate: registerSends.signdate,
      bookFrom: registerSends.bookFrom,
      bookTo: registerSends.bookTo,
      subject: registerSends.subject,
      registerDate: registerSends.registerDate,
      comment: registerSends.comment,
      workgroupName: workgroups.name,
      operation: registerSends.operation,
      urgencyLevel: registerSends.urgencyLevel,
      secretLevel: registerSends.secretLevel,
      officeType: registerSends.officeType,
    })
    .from(registerSends)
    .leftJoin(workgroups, eq(registerSends.workgroupId, workgroups.id))
    .where(and(...sendReportConditions(scope, year, visibility)))
    .orderBy(asc(registerSends.registerNumber));
}

export async function listCommandReportRows(
  year: number,
): Promise<CommandReportRow[]> {
  return db
    .select({
      registerNumber: registerCommands.registerNumber,
      year: registerCommands.year,
      bookNo: registerCommands.bookNo,
      subject: registerCommands.subject,
      signdate: registerCommands.signdate,
      comment: registerCommands.comment,
      registerDate: registerCommands.registerDate,
    })
    .from(registerCommands)
    .where(and(...commandReportConditions(year)))
    .orderBy(asc(registerCommands.registerNumber));
}

export async function countReceiveReportRows(
  scope: BookregisterScope,
  year: number,
  visibility?: RegisterListVisibility,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(registerReceives)
    .where(and(...receiveReportConditions(scope, year, visibility)));
  return row?.total ?? 0;
}

export async function countSendReportRows(
  scope: BookregisterScope,
  year: number,
  visibility?: RegisterListVisibility,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(registerSends)
    .where(and(...sendReportConditions(scope, year, visibility)));
  return row?.total ?? 0;
}

export async function countCommandReportRows(year: number): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(registerCommands)
    .where(and(...commandReportConditions(year)));
  return row?.total ?? 0;
}
