/** Legacy `person_position` (สพป.) — static map, codes 0–22 */
export const DISTRICT_POSITION_LABELS: Record<number, string> = {
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

/** Legacy `person_sch_position` (โรงเรียน/สถานศึกษา) — static map */
export const SCHOOL_POSITION_LABELS: Record<number, string> = {
  0: "บุคลากรทั่วไป",
  1: "ผู้อำนวยการโรงเรียน",
  2: "รองผู้อำนวยการโรงเรียน",
  3: "ครู",
  4: "ครูผู้ช่วย",
  5: "เจ้าหน้าที่งานสารบรรณโรงเรียน",
  11: "พนักงานราชการ",
  12: "พนักงานราชการ(ครูพี่เลี้ยง)",
  13: "พนักงานราชการ(อื่น ๆ)",
  21: "ลูกจ้างประจำ(พนักงานธุรการ)",
  22: "ลูกจ้างประจำ(พนักงานขับรถยนต์)",
  23: "ลูกจ้างประจำ(ช่างครุภัณฑ์)",
  24: "ลูกจ้างประจำ(อื่น ๆ)",
  31: "ลูกจ้างชั่วคราว(ครู)",
  32: "เจ้าหน้าที่ธุรการโรงเรียน",
  33: "ลูกจ้าง",
  34: "ครูพี่เลี้ยงฯ",
  35: "ลูกจ้างชั่วคราว(ครูผู้ทรงคุณค่า)",
  41: "ผู้จัดการโรงเรียนเอกชน",
  42: "เจ้าหน้าที่บริหารทั่วไปโรงเรียนเอกชน",
  43: "เจ้าหน้าที่อื่น ๆ โรงเรียนเอกชน",
};

export const VALID_DISTRICT_POSITION_CODES = Object.keys(DISTRICT_POSITION_LABELS)
  .map(Number)
  .sort((a, b) => a - b);

export const VALID_SCHOOL_POSITION_CODES = Object.keys(SCHOOL_POSITION_LABELS)
  .map(Number)
  .sort((a, b) => a - b);

export function isValidPositionCode(code: number, orgType: string = "district"): boolean {
  return orgType === "school"
    ? code in SCHOOL_POSITION_LABELS
    : code in DISTRICT_POSITION_LABELS;
}

/** Display position name based on organization type (district vs school). */
export function positionLabel(
  code: number | null | undefined,
  orgType: string | null | undefined = "district",
): string {
  if (code == null) return "—";
  
  if (orgType === "school") {
    return (
      SCHOOL_POSITION_LABELS[code] ??
      DISTRICT_POSITION_LABELS[code] ??
      `ไม่ระบุ (รหัส ${code})`
    );
  }

  return (
    DISTRICT_POSITION_LABELS[code] ??
    SCHOOL_POSITION_LABELS[code] ??
    `ไม่ระบุ (รหัส ${code})`
  );
}

export const POSITION_OPTIONS = VALID_DISTRICT_POSITION_CODES.map((value) => ({
  value,
  label: DISTRICT_POSITION_LABELS[value],
}));

export const SCHOOL_POSITION_OPTIONS = VALID_SCHOOL_POSITION_CODES.map((value) => ({
  value,
  label: SCHOOL_POSITION_LABELS[value],
}));
