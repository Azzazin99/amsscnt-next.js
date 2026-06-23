import "server-only";

import { notFound } from "next/navigation";
import { getDistrictOfficeName } from "@/lib/bookregister/send/queries";
import {
  getActiveLeaveYear,
  listLeaveYears,
} from "@/lib/leave/queries";
import { parseReportYear } from "@/lib/leave/reports/period";
import type { LeaveScope } from "@/lib/leave/scope";

export async function getLeaveReportOfficeName(
  scope: LeaveScope,
): Promise<string> {
  if (scope.kind === "school") return scope.schoolName;
  return (await getDistrictOfficeName()) || "สำนักงานเขตพื้นที่การศึกษา";
}

export async function resolveLeaveReportYear(
  yearParam: string | undefined,
): Promise<{ year: number; years: number[] }> {
  const [years, activeYear] = await Promise.all([
    listLeaveYears(),
    getActiveLeaveYear(),
  ]);
  const yearValues = years.map((y) => y.budgetYear);
  const year =
    parseReportYear(yearParam) ??
    activeYear?.budgetYear ??
    yearValues[0] ??
    null;

  if (!year || !yearValues.includes(year)) notFound();

  return { year, years: yearValues };
}
