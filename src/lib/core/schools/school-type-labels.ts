/** ประเภทสถานศึกษา — เทียบ system_school.school_type ใน AMSS */
export const SCHOOL_TYPE_OPTIONS = [
  { value: 1, label: "สพป." },
  { value: 2, label: "สพม." },
  { value: 3, label: "อื่น ๆ" },
  { value: 0, label: "ไม่ระบุ" },
] as const;

export function schoolTypeLabel(type: number): string {
  const found = SCHOOL_TYPE_OPTIONS.find((o) => o.value === type);
  return found?.label ?? String(type);
}
