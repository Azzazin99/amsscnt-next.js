export type LeaveReportKind =
  | "today"
  | "all"
  | "cancellations"
  | "sick-privacy-birth"
  | "vacation"
  | "school-principals";

export type LeaveReportPeriod = "full" | "first-half" | "second-half";

export type LeaveReportListRow = {
  id: number;
  displayName: string;
  schoolName: string | null;
  requestDate: string | null;
  leaveTypeLabel: string;
  leaveStart: string;
  leaveFinish: string;
  leaveTotal: number;
  grantLabel: string;
};

export type LeaveCancellationReportRow = {
  id: number;
  displayName: string;
  requestDate: string | null;
  leaveTypeLabel: string;
  cancelStart: string;
  cancelFinish: string;
  cancelTotal: number;
  grantLabel: string;
};

export type LeaveTypeStat = {
  times: number;
  days: number;
};

export type LeaveSickPrivacyBirthRow = {
  personId: string;
  displayName: string;
  positionLabel: string;
  schoolName: string | null;
  sick: LeaveTypeStat;
  privacy: LeaveTypeStat;
  birth: LeaveTypeStat;
};

export type LeaveVacationStatRow = {
  personId: string;
  displayName: string;
  positionLabel: string;
  collectDay: number;
  thisYearDay: number;
  totalEntitled: number;
  leaveTimes: number;
  leaveDays: number;
  remaining: number;
};

export type LeaveReportOption = {
  kind: LeaveReportKind;
  label: string;
  description: string;
  href: string;
  needsYear?: boolean;
};

export const LEAVE_REPORT_OPTIONS: LeaveReportOption[] = [
  {
    kind: "today",
    label: "ขออนุญาตลาวันนี้",
    description: "รายการผู้ลาที่ครอบคลุมวันที่เลือก",
    href: "/modules/leave/reports/today",
  },
  {
    kind: "all",
    label: "ขออนุญาตลาทั้งหมด",
    description: "ทะเบียนคำขอลาทั้งหมด",
    href: "/modules/leave/reports/all",
  },
  {
    kind: "cancellations",
    label: "ขอยกเลิกวันลาทั้งหมด",
    description: "ทะเบียนคำขอยกเลิกวันลา (เขต)",
    href: "/modules/leave/reports/cancellations",
  },
  {
    kind: "sick-privacy-birth",
    label: "สถิติการลาป่วย กิจ คลอด",
    description: "สรุปครั้งและวันลาป่วย กิจ คลอด ต่อบุคลากรเขต",
    href: "/modules/leave/reports/sick-privacy-birth",
    needsYear: true,
  },
  {
    kind: "vacation",
    label: "สถิติการลาพักผ่อน",
    description: "วันลาสะสม ประจำปี และการใช้สิทธิ์พักผ่อน",
    href: "/modules/leave/reports/vacation",
    needsYear: true,
  },
  {
    kind: "school-principals",
    label: "สถิติการลา ผอ.โรงเรียน",
    description: "สถิติลาป่วย กิจ คลอดของผู้อำนวยการโรงเรียน",
    href: "/modules/leave/reports/school-principals",
    needsYear: true,
  },
];
