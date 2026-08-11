import { and, eq, like, or, sql, type SQL } from "drizzle-orm";
import type {
  registerCommands,
  registerReceives,
  registerSends,
} from "@/lib/db/schema";

type RegisterListTable = typeof registerSends | typeof registerReceives;
type CommandListTable = typeof registerCommands;

export const MIN_REGISTER_LIST_QUERY_LENGTH = 2;

const REGISTER_NUMBER_SLASH = /^(\d+)\s*\/\s*(\d+)$/;

/** คำค้นว่าง = ไม่กรอง; 1 ตัวอักษร = ยังไม่ค้น; ≥2 = ค้น */
export function shouldApplyRegisterListSearch(rawTerm: string | undefined): boolean {
  const term = rawTerm?.trim() ?? "";
  if (!term) return false;
  return term.length >= MIN_REGISTER_LIST_QUERY_LENGTH;
}

export function canCommitRegisterListQuery(q: string): boolean {
  const trimmed = q.trim();
  return (
    trimmed.length === 0 || trimmed.length >= MIN_REGISTER_LIST_QUERY_LENGTH
  );
}

export function buildRegisterListSearchCondition(
  table: RegisterListTable,
  rawTerm: string | undefined,
): SQL | undefined {
  if (!shouldApplyRegisterListSearch(rawTerm)) return undefined;

  const term = rawTerm!.trim();
  const pattern = `%${term}%`;

  const parts: SQL[] = [
    like(table.subject, pattern),
    like(table.bookNo, pattern),
    like(table.bookFrom, pattern),
    like(table.bookTo, pattern),
    like(table.operation, pattern),
    like(table.comment, pattern),
    sql`CAST(${table.registerNumber} AS CHAR) LIKE ${pattern}`,
  ];

  const slash = term.match(REGISTER_NUMBER_SLASH);
  if (slash) {
    const registerNumber = Number(slash[1]);
    const year = Number(slash[2]);
    if (Number.isFinite(registerNumber) && Number.isFinite(year)) {
      parts.push(
        and(eq(table.registerNumber, registerNumber), eq(table.year, year))!,
      );
    }
  } else if (/^\d+$/.test(term)) {
    parts.push(eq(table.registerNumber, Number(term)));
  }

  return or(...parts);
}

export function buildCommandListSearchCondition(
  table: CommandListTable,
  rawTerm: string | undefined,
): SQL | undefined {
  if (!shouldApplyRegisterListSearch(rawTerm)) return undefined;

  const term = rawTerm!.trim();
  const pattern = `%${term}%`;

  const parts: SQL[] = [
    like(table.subject, pattern),
    like(table.bookNo, pattern),
    like(table.comment, pattern),
    sql`CAST(${table.registerNumber} AS CHAR) LIKE ${pattern}`,
  ];

  const slash = term.match(REGISTER_NUMBER_SLASH);
  if (slash) {
    const registerNumber = Number(slash[1]);
    const year = Number(slash[2]);
    if (Number.isFinite(registerNumber) && Number.isFinite(year)) {
      parts.push(
        and(eq(table.registerNumber, registerNumber), eq(table.year, year))!,
      );
    }
  } else if (/^\d+$/.test(term)) {
    parts.push(eq(table.registerNumber, Number(term)));
  }

  return or(...parts);
}
