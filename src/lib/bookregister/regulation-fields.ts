/** ฟิลด์ตามระเบียบงานสารบรรณ ฉบับปรับปรุง พ.ศ. 2546 */

export const URGENCY_LEVELS = [
  { value: 1, label: "ปกติ" },
  { value: 2, label: "ด่วน" },
  { value: 3, label: "ด่วนมาก" },
  { value: 4, label: "ด่วนที่สุด" },
] as const;

export const SECRET_LEVELS = [
  { value: 0, label: "ไม่ลับ" },
  { value: 1, label: "ลับ" },
  { value: 2, label: "ลับมาก" },
  { value: 3, label: "ลับที่สุด" },
] as const;

/** legacy / AMSS: 1=ป, 2=ว, 3=อ */
export const OFFICE_TYPES = [
  { value: 1, label: "ป (หนังสือทั่วไป)" },
  { value: 2, label: "ว (หนังสือเวียน)" },
  { value: 3, label: "อ" },
] as const;

export function normalizeUrgencyLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.max(1, Math.min(4, Math.floor(level)));
}

export function normalizeSecretLevel(level: number): number {
  if (!Number.isFinite(level)) return 0;
  return Math.max(0, Math.min(3, Math.floor(level)));
}

export function normalizeOfficeType(type: number): number {
  if (!Number.isFinite(type)) return 1;
  return Math.max(1, Math.min(3, Math.floor(type)));
}

export function booleanFromSecretLevel(level: number): boolean {
  return normalizeSecretLevel(level) > 0;
}

export function secretLevelFromLegacy(secret: boolean | number): number {
  if (typeof secret === "number") return normalizeSecretLevel(secret);
  return secret ? 1 : 0;
}

export function urgencyLevelLabel(level: number): string {
  return URGENCY_LEVELS.find((l) => l.value === normalizeUrgencyLevel(level))
    ?.label ?? "ปกติ";
}

export function secretLevelLabel(level: number): string {
  return SECRET_LEVELS.find((l) => l.value === normalizeSecretLevel(level))
    ?.label ?? "ไม่ลับ";
}

export function officeTypeMark(officeType: number): string {
  const t = normalizeOfficeType(officeType);
  if (t === 2) return "ว";
  if (t === 3) return "อ";
  return "";
}

export function officeTypeLabel(officeType: number): string {
  return (
    OFFICE_TYPES.find((t) => t.value === normalizeOfficeType(officeType))
      ?.label ?? "ป (หนังสือทั่วไป)"
  );
}

export function buildOutgoingBookNo(
  officeNo: string,
  officeType: number,
  registerNumber: number,
): string {
  const prefix = officeNo.trim();
  const mark = officeTypeMark(officeType);
  return `${prefix}${mark}${registerNumber}`;
}
