import { isLeaveTypeId, type LeaveTypeId } from "@/lib/leave/regulation/types";

const SICK_LEAVE_ATTACHMENT_MIN_DAYS = 30;

type AttachmentContext = {
  leaveType: number;
  leaveTotal: number;
};

export function showsLeaveAttachmentUI({
  leaveType,
}: Pick<AttachmentContext, "leaveType">): boolean {
  return isLeaveTypeId(leaveType);
}

export function requiresLeaveAttachment({
  leaveType,
  leaveTotal,
}: AttachmentContext): boolean {
  if (!isLeaveTypeId(leaveType)) return false;

  if (leaveType === 1) {
    return leaveTotal >= SICK_LEAVE_ATTACHMENT_MIN_DAYS;
  }

  return false;
}

export function leaveAttachmentHint(
  leaveType: number,
  leaveTotal: number,
): string | null {
  if (!showsLeaveAttachmentUI({ leaveType })) return null;

  if (leaveType === 1 && requiresLeaveAttachment({ leaveType, leaveTotal })) {
    return "ตามข้อ 18 — แนบใบรับรองแพทย์ (ลาป่วยติดต่อกัน ≥30 วัน)";
  }

  if (leaveType === 1) {
    return "สามารถแนบใบรับรองแพทย์ได้ (ไม่บังคับ)";
  }

  return "สามารถแนบเอกสารประกอบได้ (ไม่บังคับ)";
}

export function validateLeaveAttachment({
  leaveType,
  leaveTotal,
  hasFile,
}: AttachmentContext & { hasFile: boolean }): string | null {
  if (!requiresLeaveAttachment({ leaveType, leaveTotal })) return null;

  if (hasFile) return null;

  if (leaveType === 1) {
    return "ลาป่วยติดต่อกัน 30 วันขึ้นไป ต้องแนบใบรับรองแพทย์ (ข้อ 18)";
  }

  return "กรุณาแนบไฟล์หลักฐาน";
}

export type { LeaveTypeId };
