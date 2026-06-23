export {
  LEAVE_TYPES,
  LEAVE_TYPE_OPTIONS,
  LEAVE_TYPE_IDS,
  HALF_DAY_OPTIONS,
  leaveTypeAllowsBackdate,
  leaveTypeLabel,
  isLeaveTypeId,
  type LeaveTypeId,
  type HalfDayPeriod,
  type EligibleSex,
} from "@/lib/leave/regulation/types";

export {
  isLeaveTypeEligibleForSex,
  leaveTypeOptionsForSex,
  leaveTypesRequiringSex,
  leaveSexEligibilityError,
  personSexToEligible,
} from "@/lib/leave/regulation/eligibility";

export {
  grantStatusLabel,
  workflowStatusLabel,
  currentWorkflowStatus,
  type WorkflowStatus,
  type ApprovalStep,
} from "@/lib/leave/regulation/approval-chain";

export { computeLeaveTotal } from "@/lib/leave/regulation/validation";

export {
  showsLeaveAttachmentUI,
  requiresLeaveAttachment,
  leaveAttachmentHint,
  validateLeaveAttachment,
} from "@/lib/leave/regulation/attachments";
