export const PERSON_PREFIX_OPTIONS = [
  { value: "นาย", label: "นาย", sex: "1" as const },
  { value: "นาง", label: "นาง", sex: "2" as const },
  { value: "นางสาว", label: "นางสาว", sex: "2" as const },
] as const;

export type PersonPrefix = (typeof PERSON_PREFIX_OPTIONS)[number]["value"];

export const PERSON_SEX_OPTIONS = [
  { value: "1", label: "ชาย" },
  { value: "2", label: "หญิง" },
] as const;

export type PersonSex = (typeof PERSON_SEX_OPTIONS)[number]["value"];

const PREFIX_VALUES = new Set<string>(
  PERSON_PREFIX_OPTIONS.map((o) => o.value),
);

export function normalizePersonPrefix(
  raw: string | null | undefined,
): PersonPrefix | null {
  if (!raw) return null;
  const collapsed = raw.trim().replace(/\s+/g, "");
  if (collapsed === "นาย") return "นาย";
  if (collapsed === "นาง") return "นาง";
  if (collapsed === "นางสาว") return "นางสาว";
  return null;
}

export function isPersonPrefix(
  value: string | null | undefined,
): value is PersonPrefix {
  return value != null && PREFIX_VALUES.has(value);
}

export function sexFromPrefix(
  prefix: string | null | undefined,
): PersonSex | null {
  const normalized = normalizePersonPrefix(prefix);
  if (!normalized) return null;
  return PERSON_PREFIX_OPTIONS.find((o) => o.value === normalized)?.sex ?? null;
}

export function sexLabel(sex: string | null | undefined): string {
  if (!sex) return "—";
  return PERSON_SEX_OPTIONS.find((s) => s.value === sex)?.label ?? sex;
}

export function isPersonSex(value: string | null | undefined): value is PersonSex {
  return value === "1" || value === "2";
}

/** ค่า default สำหรับ select เมื่อ prefix ใน DB ไม่ตรง 3 ค่า canonical */
export function prefixSelectValue(
  prefix: string | null | undefined,
): PersonPrefix | "" {
  return normalizePersonPrefix(prefix) ?? "";
}
