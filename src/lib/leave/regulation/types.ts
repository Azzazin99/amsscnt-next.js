/** ประเภทการลาตามระเบียบ สำนักนายกฯ ว่าด้วยการลาของข้าราชการ พ.ศ. 2555 */

export const LEAVE_TYPE_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
] as const;

export type LeaveTypeId = (typeof LEAVE_TYPE_IDS)[number];

export type EligibleSex = "any" | "male" | "female";

export type LeaveTypeDefinition = {
  id: LeaveTypeId;
  label: string;
  /** มีโควต้ารายปีงบที่ต้องตรวจสอบ */
  hasAnnualQuota: boolean;
  /** ลาย้อนหลังได้ */
  allowsBackdate: boolean;
  /** สิทธิ์ตามเพศ — ระเบียบ 2555 */
  eligibleSex: EligibleSex;
};

/** legacy 1–4 คงค่าเดิม; 5–10 เพิ่มตาม 2555 */
export const LEAVE_TYPES: Record<LeaveTypeId, LeaveTypeDefinition> = {
  1: { id: 1, label: "ลาป่วย", hasAnnualQuota: false, allowsBackdate: true, eligibleSex: "any" },
  2: { id: 2, label: "ลากิจส่วนตัว", hasAnnualQuota: true, allowsBackdate: false, eligibleSex: "any" },
  3: { id: 3, label: "ลาคลอดบุตร", hasAnnualQuota: true, allowsBackdate: true, eligibleSex: "female" },
  4: { id: 4, label: "ลาพักผ่อน", hasAnnualQuota: true, allowsBackdate: false, eligibleSex: "any" },
  5: { id: 5, label: "ลาอุปสมบท", hasAnnualQuota: true, allowsBackdate: false, eligibleSex: "male" },
  6: { id: 6, label: "ลาเข้ารับการตรวจเลือกหรือเตรียมพล", hasAnnualQuota: false, allowsBackdate: false, eligibleSex: "male" },
  7: { id: 7, label: "ลาติดตามคู่สมรส", hasAnnualQuota: false, allowsBackdate: false, eligibleSex: "any" },
  8: { id: 8, label: "ลาศึกษา ฝึกอบรม ดูงาน หรือปฏิบัติการวิจัย", hasAnnualQuota: false, allowsBackdate: false, eligibleSex: "any" },
  9: { id: 9, label: "ลาไปช่วยเหลือภริยาที่คลอดบุตร", hasAnnualQuota: false, allowsBackdate: false, eligibleSex: "male" },
  10: { id: 10, label: "ลาไปฟื้นฟูสมรรถภาพด้านอาชีพ", hasAnnualQuota: false, allowsBackdate: false, eligibleSex: "any" },
};

export const LEAVE_TYPE_OPTIONS = LEAVE_TYPE_IDS.map((id) => ({
  value: id,
  label: LEAVE_TYPES[id].label,
}));

export function isLeaveTypeId(value: number): value is LeaveTypeId {
  return LEAVE_TYPE_IDS.includes(value as LeaveTypeId);
}

export function leaveTypeLabel(leaveType: number): string {
  if (isLeaveTypeId(leaveType)) return LEAVE_TYPES[leaveType].label;
  return `ประเภท ${leaveType}`;
}

export function leaveTypeAllowsBackdate(leaveType: number): boolean {
  if (!isLeaveTypeId(leaveType)) return false;
  return LEAVE_TYPES[leaveType].allowsBackdate;
}

export type HalfDayPeriod = "morning" | "afternoon";

export const HALF_DAY_OPTIONS: { value: HalfDayPeriod; label: string }[] = [
  { value: "morning", label: "ครึ่งวันเช้า" },
  { value: "afternoon", label: "ครึ่งวันบ่าย" },
];
