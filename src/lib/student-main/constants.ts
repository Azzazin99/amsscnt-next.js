export const STUDENT_CLASS_LEVELS = [
  { value: 1, label: "อ.1" },
  { value: 2, label: "อ.2" },
  { value: 3, label: "อ.3" },
  { value: 4, label: "ป.1" },
  { value: 5, label: "ป.2" },
  { value: 6, label: "ป.3" },
  { value: 7, label: "ป.4" },
  { value: 8, label: "ป.5" },
  { value: 9, label: "ป.6" },
  { value: 10, label: "ม.1" },
  { value: 11, label: "ม.2" },
  { value: 12, label: "ม.3" },
  { value: 13, label: "ม.4" },
  { value: 14, label: "ม.5" },
  { value: 15, label: "ม.6" },
] as const;

export const STUDENT_SEX_OPTIONS = [
  { value: "ช", label: "ชาย" },
  { value: "ญ", label: "หญิง" },
] as const;

export function classLevelLabel(classLevel: number): string {
  return (
    STUDENT_CLASS_LEVELS.find((c) => c.value === classLevel)?.label ??
    `#${classLevel}`
  );
}

export function sexLabel(sex: string): string {
  return STUDENT_SEX_OPTIONS.find((s) => s.value === sex)?.label ?? sex;
}

export function buildStudentRefId(schoolCode: string, studentId: string): string {
  return `${schoolCode}${studentId}`;
}
