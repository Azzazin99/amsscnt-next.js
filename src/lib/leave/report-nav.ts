import {
  LEAVE_REPORT_OPTIONS,
  type LeaveReportKind,
  type LeaveReportOption,
} from "@/lib/leave/reports/types";

export type LeaveReportNavOpts = {
  scopeKind: "district" | "school";
  isPrincipalViewer: boolean;
};

/** Flyout รายงานหลัก 6 รายการ (legacy เขต) */
export const LEAVE_REPORT_NAV_KINDS: LeaveReportKind[] = [
  "today",
  "all",
  "cancellations",
  "sick-privacy-birth",
  "vacation",
  "school-principals",
];

export function isLeaveReportNavItemVisible(
  kind: LeaveReportKind,
  opts: LeaveReportNavOpts,
): boolean {
  switch (kind) {
    case "today":
    case "all":
      return true;
    case "vacation":
      return opts.scopeKind === "district";
    case "cancellations":
    case "sick-privacy-birth":
    case "school-principals":
      return opts.scopeKind === "district" || opts.isPrincipalViewer;
    default:
      return false;
  }
}

export function listVisibleLeaveReportOptions(
  navOpts: LeaveReportNavOpts,
): LeaveReportOption[] {
  return LEAVE_REPORT_NAV_KINDS.map((kind) =>
    LEAVE_REPORT_OPTIONS.find((option) => option.kind === kind),
  )
    .filter((option): option is LeaveReportOption => option != null)
    .filter((option) => isLeaveReportNavItemVisible(option.kind, navOpts));
}
