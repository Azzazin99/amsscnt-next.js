const THAI_MONTH_COMPACT: Record<number, string> = {
  1: "มค",
  2: "กพ",
  3: "มีค",
  4: "เมย",
  5: "พค",
  6: "มิย",
  7: "กค",
  8: "สค",
  9: "กย",
  10: "ตค",
  11: "พย",
  12: "ธค",
};

const THAI_MONTH_SHORT: Record<number, string> = {
  1: "ม.ค.",
  2: "ก.พ.",
  3: "มี.ค.",
  4: "เม.ย.",
  5: "พ.ค.",
  6: "มิ.ย.",
  7: "ก.ค.",
  8: "ส.ค.",
  9: "ก.ย.",
  10: "ต.ค.",
  11: "พ.ย.",
  12: "ธ.ค.",
};

type Ymd = { year: number; month: number; day: number };

/**
 * แยกปี/เดือน/วันแบบ deterministic (ไม่พึ่ง timezone/locale) —
 * ค่าจาก DB เป็น string "YYYY-MM-DD" อยู่แล้ว จึง parse ตรงๆ กัน hydration mismatch
 */
function parseYmd(value: string | Date): Ymd | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
    };
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

/** วันที่แบบไทยสั้น เช่น 15 ม.ค. 2569 (ปีพุทธศักราช) */
export function formatThaiDate(value: string | Date | null | undefined): string {
  if (!value) return "";

  const ymd = parseYmd(value);
  if (!ymd) return String(value);

  const monthLabel = THAI_MONTH_SHORT[ymd.month];
  if (!monthLabel) return String(value);

  return `${ymd.day} ${monthLabel} ${ymd.year + 543}`;
}

/** รูปแบบ legacy thai_date_3 — เช่น 29 พค 2569 (ปีพุทธศักราช) */
export function formatThaiDateCompact(
  value: string | Date | null | undefined,
): string {
  if (!value) return "";

  const ymd = parseYmd(value);
  if (!ymd) return String(value);

  const monthLabel = THAI_MONTH_COMPACT[ymd.month];
  if (!monthLabel) return String(value);

  return `${ymd.day} ${monthLabel} ${ymd.year + 543}`;
}

/** ตรวจว่าเป็นวันที่ค.ศ. ที่มีจริงในปฏิทิน (ไม่พึ่ง timezone) */
export function isValidGregorianDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1) return false;
  if (year < 1900 || year > 2100) return false;
  const maxDay = new Date(year, month, 0).getDate();
  return day <= maxDay;
}

/** จำนวนวันสูงสุดในเดือน (ค.ศ.) */
export function daysInGregorianMonth(yearCE: number, month: number): number {
  if (month < 1 || month > 12) return 31;
  if (!Number.isFinite(yearCE)) return 31;
  return new Date(yearCE, month, 0).getDate();
}

/**
 * ประกอบ ISO จาก วัน/เดือน/ปี พ.ศ. — คืน null ถ้าวันที่ไม่ถูกต้องหรือกรอกไม่ครบ
 */
export function composeIsoFromThaiParts(
  day: number,
  month: number,
  yearBE: number,
): string | null {
  if (!day || !month || !yearBE) return null;
  const yearCE = yearBE - 543;
  if (!isValidGregorianDate(yearCE, month, day)) return null;
  return `${String(yearCE).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** แปลง ISO "YYYY-MM-DD" เป็น Date แบบ local (ไม่พึ่ง timezone) */
export function parseIsoToLocalDate(iso: string): Date | null {
  const ymd = parseYmd(iso.trim());
  if (!ymd) return null;
  if (!isValidGregorianDate(ymd.year, ymd.month, ymd.day)) return null;
  return new Date(ymd.year, ymd.month - 1, ymd.day);
}

/** แปลง Date local เป็น ISO "YYYY-MM-DD" */
export function isoFromLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
