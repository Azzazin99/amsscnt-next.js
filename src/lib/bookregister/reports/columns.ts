/** คอลัมน์แบบทะเบียนตามระเบียบ 2546 / export legacy AMSS++ */

export type RegisterReportKind = "receive" | "send" | "command";

export type RegisterReportColumn = {
  id: string;
  header: string;
  align?: "left" | "center" | "right";
  width?: string;
};

export const RECEIVE_REPORT_COLUMNS: RegisterReportColumn[] = [
  { id: "seq", header: "ลำดับที่", align: "center", width: "3%" },
  { id: "registerNumber", header: "เลขทะเบียนรับ", align: "center", width: "4%" },
  { id: "year", header: "ปี", align: "center", width: "3%" },
  { id: "bookNo", header: "ที่", align: "left", width: "8%" },
  { id: "signdate", header: "ลงวันที่", align: "center", width: "6%" },
  { id: "bookFrom", header: "จาก", align: "left", width: "10%" },
  { id: "bookTo", header: "ถึง", align: "left", width: "10%" },
  { id: "subject", header: "เรื่อง", align: "left" },
  { id: "urgencyLevel", header: "ชั้นความเร็ว", align: "center", width: "6%" },
  { id: "secretLevel", header: "ชั้นความลับ", align: "center", width: "6%" },
  { id: "registerDate", header: "วันลงทะเบียน", align: "center", width: "6%" },
  { id: "comment", header: "หมายเหตุ", align: "left", width: "8%" },
  { id: "workgroupName", header: "กลุ่มปฏิบัติ", align: "left", width: "8%" },
  { id: "operation", header: "การปฏิบัติ", align: "left", width: "8%" },
];

export const SEND_REPORT_COLUMNS: RegisterReportColumn[] = [
  { id: "seq", header: "ลำดับที่", align: "center", width: "3%" },
  { id: "registerNumber", header: "เลขทะเบียนส่ง", align: "center", width: "4%" },
  { id: "year", header: "ปี", align: "center", width: "3%" },
  { id: "bookNo", header: "ที่", align: "left", width: "8%" },
  { id: "officeType", header: "ประเภท", align: "center", width: "4%" },
  { id: "signdate", header: "ลงวันที่", align: "center", width: "6%" },
  { id: "bookFrom", header: "จาก", align: "left", width: "9%" },
  { id: "bookTo", header: "ถึง", align: "left", width: "9%" },
  { id: "subject", header: "เรื่อง", align: "left" },
  { id: "urgencyLevel", header: "ชั้นความเร็ว", align: "center", width: "6%" },
  { id: "secretLevel", header: "ชั้นความลับ", align: "center", width: "6%" },
  { id: "registerDate", header: "วันลงทะเบียน", align: "center", width: "6%" },
  { id: "comment", header: "หมายเหตุ", align: "left", width: "7%" },
  { id: "workgroupName", header: "กลุ่มปฏิบัติ", align: "left", width: "7%" },
  { id: "operation", header: "การปฏิบัติ", align: "left", width: "7%" },
];

export const COMMAND_REPORT_COLUMNS: RegisterReportColumn[] = [
  { id: "seq", header: "ลำดับที่", align: "center", width: "4%" },
  { id: "registerNumber", header: "เลขทะเบียน", align: "center", width: "5%" },
  { id: "year", header: "ปี", align: "center", width: "4%" },
  { id: "bookNo", header: "ที่คำสั่ง", align: "left", width: "10%" },
  { id: "subject", header: "เรื่อง", align: "left" },
  { id: "signdate", header: "สั่ง ณ วันที่", align: "center", width: "8%" },
  { id: "comment", header: "หมายเหตุ", align: "left", width: "12%" },
  { id: "registerDate", header: "วันลงทะเบียน", align: "center", width: "8%" },
];

export const REPORT_TITLES: Record<
  RegisterReportKind,
  { title: string; subtitle: string }
> = {
  receive: {
    title: "ทะเบียนหนังสือรับ",
    subtitle: "รายงานทะเบียนรับประจำปี (แบบระเบียบงานสารบรรณ พ.ศ. 2546)",
  },
  send: {
    title: "ทะเบียนหนังสือส่ง",
    subtitle: "รายงานทะเบียนส่งประจำปี (แบบระเบียบงานสารบรรณ พ.ศ. 2546)",
  },
  command: {
    title: "ทะเบียนคำสั่ง",
    subtitle: "รายงานทะเบียนคำสั่งประจำปี",
  },
};

export function reportColumnsForKind(
  kind: RegisterReportKind,
): RegisterReportColumn[] {
  if (kind === "send") return SEND_REPORT_COLUMNS;
  if (kind === "command") return COMMAND_REPORT_COLUMNS;
  return RECEIVE_REPORT_COLUMNS;
}
