import { z, type ZodError, type ZodType } from "zod";

export function formDataToObject(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData.entries());
}

/** FormData.get() / ช่องที่ไม่มีใน form คืน null — แปลงเป็น "" ก่อน z.string() */
export function formEntryString<T extends ZodType>(schema: T) {
  return z.preprocess((val) => (val == null ? "" : val), schema);
}

const GENERIC_ZOD_MESSAGE = /^Invalid input:/;

function normalizeZodMessage(message: string | undefined, fallback: string): string {
  if (!message || GENERIC_ZOD_MESSAGE.test(message)) return fallback;
  return message;
}

function issueFieldKey(path: PropertyKey[]): string | undefined {
  if (path.length === 0) return undefined;
  const key = path[path.length - 1];
  if (typeof key === "string" || typeof key === "number") {
    return String(key);
  }
  return undefined;
}

export function zodFieldErrors(
  error: ZodError,
  fallback = "ข้อมูลไม่ถูกต้อง",
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issueFieldKey(issue.path);
    if (key === undefined || key in map) continue;
    map[key] = normalizeZodMessage(issue.message, fallback);
  }
  return map;
}

export function firstZodErrorMessage(error: ZodError, fallback = "ข้อมูลไม่ถูกต้อง"): string {
  return normalizeZodMessage(error.issues[0]?.message, fallback);
}
