import { fiscalYearRange } from "@/lib/leave/regulation/fiscal-year";
import type { LeaveReportPeriod } from "@/lib/leave/reports/types";

export function reportPeriodRange(
  budgetYear: number,
  period: LeaveReportPeriod,
): { startIso: string; endIso: string } {
  const full = fiscalYearRange(budgetYear);
  if (period === "full") return full;

  const gregorianStart = budgetYear - 543 - 1;
  if (period === "first-half") {
    return {
      startIso: `${gregorianStart}-10-01`,
      endIso: `${gregorianStart + 1}-03-31`,
    };
  }

  return {
    startIso: `${gregorianStart + 1}-04-01`,
    endIso: `${gregorianStart + 1}-09-30`,
  };
}

export function countInclusiveDays(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.max(0, diff);
}

export function overlapDays(
  rangeStart: string,
  rangeEnd: string,
  leaveStart: string,
  leaveFinish: string,
): number {
  const start = leaveStart > rangeStart ? leaveStart : rangeStart;
  const end = leaveFinish < rangeEnd ? leaveFinish : rangeEnd;
  if (start > end) return 0;
  return countInclusiveDays(start, end);
}

export function parseReportPeriod(raw: string | undefined): LeaveReportPeriod {
  if (raw === "first-half" || raw === "second-half") return raw;
  return "full";
}

export function parseReportYear(raw: string | undefined): number | null {
  if (!raw) return null;
  const year = Number(raw);
  if (!Number.isFinite(year) || year < 2500 || year > 2700) return null;
  return Math.floor(year);
}
