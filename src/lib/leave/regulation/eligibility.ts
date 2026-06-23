import type { PersonSex } from "@/lib/person/constants";
import { isPersonSex } from "@/lib/person/constants";
import {
  LEAVE_TYPES,
  LEAVE_TYPE_IDS,
  type EligibleSex,
  type LeaveTypeId,
} from "@/lib/leave/regulation/types";
import { isLeaveTypeId } from "@/lib/leave/regulation/types";

export function personSexToEligible(
  sex: string | null | undefined,
): "male" | "female" | null {
  if (sex === "1") return "male";
  if (sex === "2") return "female";
  return null;
}

export function isLeaveTypeEligibleForSex(
  leaveType: number,
  sex: string | null | undefined,
): boolean {
  if (!isLeaveTypeId(leaveType)) return false;

  const def = LEAVE_TYPES[leaveType];
  if (def.eligibleSex === "any") return true;

  const eligible = personSexToEligible(sex);
  if (!eligible) return false;

  return def.eligibleSex === eligible;
}

export function leaveTypeOptionsForSex(sex: string | null | undefined) {
  return LEAVE_TYPE_IDS.filter((id) => isLeaveTypeEligibleForSex(id, sex)).map(
    (id) => ({
      value: id,
      label: LEAVE_TYPES[id].label,
    }),
  );
}

/** ประเภทที่ต้องมี sex ในระบบก่อนยื่น */
export function leaveTypesRequiringSex(): LeaveTypeId[] {
  return LEAVE_TYPE_IDS.filter((id) => LEAVE_TYPES[id].eligibleSex !== "any");
}

export function leaveSexEligibilityError(
  leaveType: number,
  sex: string | null | undefined,
): string | null {
  if (!isLeaveTypeId(leaveType)) return null;
  if (isLeaveTypeEligibleForSex(leaveType, sex)) return null;

  const def = LEAVE_TYPES[leaveType];
  if (def.eligibleSex === "any") return null;

  if (!isPersonSex(sex)) {
    return "กรุณาเลือกคำนำหน้าในข้อมูลบุคลากรก่อนยื่นประเภทการลานี้";
  }

  return "ประเภทการลานี้ไม่ตรงกับคำนำหน้าในระบบ";
}

export type { EligibleSex, PersonSex };
