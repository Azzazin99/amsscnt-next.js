import { bangkokTodayIso } from "@/lib/book/dates";
import { leaveSexEligibilityError } from "@/lib/leave/regulation/eligibility";
import type { HalfDayPeriod, LeaveTypeId } from "@/lib/leave/regulation/types";
import { isLeaveTypeId, leaveTypeAllowsBackdate } from "@/lib/leave/regulation/types";

export function computeLeaveTotal(
  leaveStart: string,
  leaveFinish: string,
  halfDayPeriod: HalfDayPeriod | null,
): number {
  if (halfDayPeriod) {
    if (leaveStart !== leaveFinish) {
      throw new Error("ลาครึ่งวันต้องเป็นวันเดียว");
    }
    return 0.5;
  }

  const start = new Date(`${leaveStart}T00:00:00`);
  const finish = new Date(`${leaveFinish}T00:00:00`);
  const diffMs = finish.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export type LeaveRequestValidationInput = {
  leaveType: number;
  leaveStart: string;
  leaveFinish: string;
  halfDayPeriod: HalfDayPeriod | null;
  remainingQuota: number | null;
  personSex?: string | null;
};

export function validateLeaveRequestInput(
  input: LeaveRequestValidationInput,
): string | null {
  if (!isLeaveTypeId(input.leaveType)) {
    return "กรุณาเลือกประเภทการลา";
  }

  const leaveType = input.leaveType as LeaveTypeId;

  const sexErr = leaveSexEligibilityError(leaveType, input.personSex ?? null);
  if (sexErr) return sexErr;

  if (input.leaveFinish < input.leaveStart) {
    return "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม";
  }

  if (
    !leaveTypeAllowsBackdate(leaveType) &&
    input.leaveStart < bangkokTodayIso()
  ) {
    return "ลาประเภทนี้ไม่สามารถลาย้อนหลังได้";
  }

  let leaveTotal: number;
  try {
    leaveTotal = computeLeaveTotal(
      input.leaveStart,
      input.leaveFinish,
      input.halfDayPeriod,
    );
  } catch (e) {
    return e instanceof Error ? e.message : "จำนวนวันลาไม่ถูกต้อง";
  }

  if (leaveTotal < 0.5) {
    return "จำนวนวันลาไม่ถูกต้อง";
  }

  if (input.remainingQuota !== null && leaveTotal > input.remainingQuota) {
    return `เกินสิทธิ์ลาคงเหลือ (เหลือ ${input.remainingQuota} วัน)`;
  }

  if (leaveType === 4 && input.remainingQuota === null) {
    return "กรุณาระบุวันเริ่มราชการในข้อมูลบุคลากรก่อนยื่นลาพักผ่อน";
  }

  return null;
}

export type LeaveCancellationValidationInput = {
  permissionStart: string;
  permissionFinish: string;
  permissionTotal: number;
  cancelStart: string;
  cancelFinish: string;
  cancelTotal: number;
};

export function validateLeaveCancellationInput(
  input: LeaveCancellationValidationInput,
): string | null {
  if (input.cancelFinish < input.cancelStart) {
    return "วันสิ้นสุดที่ยกเลิกต้องไม่ก่อนวันเริ่ม";
  }

  if (
    input.cancelStart < input.permissionStart ||
    input.cancelFinish > input.permissionFinish
  ) {
    return "วันที่ยกเลิกต้องอยู่ในช่วงลาที่อนุมัติแล้ว";
  }

  if (input.cancelTotal < 0.5) {
    return "จำนวนวันที่ยกเลิกไม่ถูกต้อง";
  }

  if (input.cancelTotal > input.permissionTotal) {
    return "จำนวนวันที่ยกเลิกต้องไม่เกินวันลาที่อนุมัติ";
  }

  let expectedTotal: number;
  try {
    expectedTotal = computeLeaveTotal(
      input.cancelStart,
      input.cancelFinish,
      null,
    );
  } catch (e) {
    return e instanceof Error ? e.message : "จำนวนวันที่ยกเลิกไม่ถูกต้อง";
  }

  if (Math.abs(expectedTotal - input.cancelTotal) > 0.001) {
    return "จำนวนวันที่ยกเลิกไม่ตรงกับช่วงวันที่เลือก";
  }

  return null;
}
