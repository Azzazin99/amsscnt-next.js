import type { LeaveTypeId } from "@/lib/leave/regulation/types";
import { LEAVE_TYPES } from "@/lib/leave/regulation/types";

/** ลากิจส่วนตัว — ข้อ 19 ระเบียบ 2555 */
export const PERSONAL_LEAVE_DAYS_PER_YEAR = 45;

/** ลาคลอดบุตร — ข้อ 21 */
export const MATERNITY_LEAVE_DAYS = 90;

/** ลาอุปสมบท — ข้อ 22 */
export const ORDINATION_LEAVE_DAYS = 120;

/** ลาพักผ่อนสะสมสูงสุด — ข้อ 25 */
export const VACATION_CARRYOVER_MAX = 30;

export function yearsOfService(serviceStartIso: string, asOfIso: string): number {
  const start = new Date(`${serviceStartIso}T00:00:00`);
  const asOf = new Date(`${asOfIso}T00:00:00`);
  let years = asOf.getFullYear() - start.getFullYear();
  const monthDiff = asOf.getMonth() - start.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < start.getDate())) {
    years -= 1;
  }
  return Math.max(0, years);
}

/** วันลาพักผ่อนต่อปีงบตามอายุราชการ — ข้อ 24 */
export function vacationDaysPerYear(yearsOfServiceCount: number): number {
  if (yearsOfServiceCount >= 20) return 20;
  if (yearsOfServiceCount >= 10) return 15;
  return 10;
}

export type EntitlementInput = {
  leaveType: LeaveTypeId;
  serviceStartIso: string | null;
  asOfIso: string;
  carriedVacationDays?: number;
};

export type EntitlementResult = {
  entitled: number | null;
  carried: number;
  /** null = ไม่จำกัดรายปี */
  unlimited: boolean;
};

export function computeEntitlement(input: EntitlementInput): EntitlementResult {
  const { leaveType, serviceStartIso, asOfIso, carriedVacationDays = 0 } = input;
  const def = LEAVE_TYPES[leaveType];

  if (!def.hasAnnualQuota) {
    return { entitled: null, carried: 0, unlimited: true };
  }

  switch (leaveType) {
    case 2:
      return { entitled: PERSONAL_LEAVE_DAYS_PER_YEAR, carried: 0, unlimited: false };
    case 3:
      return { entitled: MATERNITY_LEAVE_DAYS, carried: 0, unlimited: false };
    case 4: {
      if (!serviceStartIso) {
        return { entitled: null, carried: 0, unlimited: false };
      }
      const yos = yearsOfService(serviceStartIso, asOfIso);
      const base = vacationDaysPerYear(yos);
      const carried = Math.min(
        Math.max(0, carriedVacationDays),
        VACATION_CARRYOVER_MAX,
      );
      return { entitled: base + carried, carried, unlimited: false };
    }
    case 5:
      return { entitled: ORDINATION_LEAVE_DAYS, carried: 0, unlimited: false };
    default:
      return { entitled: null, carried: 0, unlimited: true };
  }
}

export function computeCarryoverVacation(
  previousEntitled: number,
  previousUsed: number,
): number {
  const unused = Math.max(0, previousEntitled - previousUsed);
  return Math.min(unused, VACATION_CARRYOVER_MAX);
}
