import type { LeaveTypeId } from "@/lib/leave/regulation/types";

export type ApprovalStep = "group" | "group2" | "commander";

export type ApprovalRequestState = {
  schoolId?: number | null;
  groupDate: Date | null;
  groupDate2?: Date | null;
  commanderGrant: number | null;
};

export type WorkflowStatus =
  | "approved"
  | "rejected"
  | "group"
  | "group2"
  | "commander";

/** ผู้ลา → ผอ.กลุ่ม → รอง ผอ.สพท. (เขต) หรือ ผอ.สพท. (โรงเรียน) */
export function requiredApprovalSteps(
  _leaveType: LeaveTypeId,
  _leaveTotal: number,
  schoolId?: number | null,
): ApprovalStep[] {
  if (schoolId != null) return ["group", "commander"];
  return ["group", "group2"];
}

export function currentWorkflowStatus(
  request: ApprovalRequestState,
): WorkflowStatus {
  if (request.commanderGrant === 1) return "approved";
  if (request.commanderGrant === 0) return "rejected";
  if (!request.groupDate) return "group";
  if (request.schoolId != null) return "commander";
  return "group2";
}

export function workflowStatusLabel(status: WorkflowStatus): string {
  switch (status) {
    case "approved":
      return "อนุมัติ";
    case "rejected":
      return "ไม่อนุมัติ";
    case "group":
      return "รอผอ.กลุ่ม";
    case "group2":
      return "รอรอง ผอ.สพท.";
    case "commander":
      return "รอผอ.สพท.";
  }
}

export function grantStatusLabel(commanderGrant: number | null): string {
  if (commanderGrant === 1) return "อนุมัติ";
  if (commanderGrant === 0) return "ไม่อนุมัติ";
  return "รอพิจารณา";
}
