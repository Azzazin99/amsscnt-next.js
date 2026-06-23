/** Legacy `person_position` (สพป.) — static map, codes 1–22 */
const POSITION_LABELS: Record<number, string> = {
  0: "บุคลากรทั่วไป",
  1: "ผู้อำนวยการสำนักงานเขตพื้นที่การศึกษา",
  2: "รองผู้อำนวยการสำนักงานเขตพื้นที่การศึกษา",
  3: "ผู้อำนวยการกลุ่ม",
  4: "ศึกษานิเทศก์",
  5: "นักจัดการงานทั่วไป",
  6: "เจ้าพนักงานธุรการ",
  7: "นักประชาสัมพันธ์",
  8: "นักวิชาการเงินและบัญชี",
  9: "เจ้าพนักงานการเงินและบัญชี",
  10: "นักวิชาการพัสดุ",
  11: "เจ้าหน้าที่พัสดุ",
  12: "นักทรัพยากรบุคคล",
  13: "นิติกร",
  14: "นักวิเคราะห์นโยบายและแผน",
  15: "นักวิชาการคอมพิวเตอร์",
  16: "นักวิชาการศึกษา",
  17: "นักวิชาการตรวจสอบภายใน",
  18: "พนักงานพิมพ์ดีด",
  19: "ลูกจ้างชั่วคราว",
  20: "ลูกจ้างประจำ",
  21: "นักศึกษาฝึกงาน",
  22: "พนักงานราชการ",
};

export const VALID_POSITION_CODES = Object.keys(POSITION_LABELS)
  .map(Number)
  .sort((a, b) => a - b);

export function isValidPositionCode(code: number): boolean {
  return code in POSITION_LABELS;
}

/** Display name only — no "ตำแหน่ง" prefix (call sites add it where needed). */
export function positionLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return POSITION_LABELS[code] ?? `ไม่ระบุ (รหัส ${code})`;
}

export const POSITION_OPTIONS = VALID_POSITION_CODES.map((value) => ({
  value,
  label: POSITION_LABELS[value],
}));
