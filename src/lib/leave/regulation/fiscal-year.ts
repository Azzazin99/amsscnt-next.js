/** ปีงบประมาณ ต.ค.–ก.ย. (พ.ศ.) ตาม leave_years.budget_year */

import { sql, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";

export function budgetYearFromIsoDate(isoDate: string): number {
  const [y, m] = isoDate.split("-").map(Number);
  const month = m ?? 1;
  const gregorianYear = y ?? 2000;
  const buddhistYear = gregorianYear + 543;
  // ต.ค.–ธ.ค. = ปีงบปีถัดไป
  if (month >= 10) return buddhistYear + 1;
  return buddhistYear;
}

export function fiscalYearRange(budgetYear: number): { startIso: string; endIso: string } {
  const gregorianStart = budgetYear - 543 - 1;
  const startIso = `${gregorianStart}-10-01`;
  const endIso = `${budgetYear - 543}-09-30`;
  return { startIso, endIso };
}

/** ปีงบของวันที่ในคอลัมน์ date — เทียบ legacy budgetYearFromIsoDate(leave_start) */
export function budgetYearMatchesDateColumn(
  column: AnyColumn,
  budgetYear: number,
): SQL {
  return sql`(
    CASE
      WHEN EXTRACT(MONTH FROM ${column}) >= 10
      THEN EXTRACT(YEAR FROM ${column}) + 544
      ELSE EXTRACT(YEAR FROM ${column}) + 543
    END
  ) = ${budgetYear}`;
}
