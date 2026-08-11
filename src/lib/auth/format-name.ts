export function stripThaiPrefix(name: string): string {
  if (!name) return "";
  return name
    .replace(
      /^(นาย|นางสาว|นาง|ดร\.|ว่าที่ ร\.ต\.|ผศ\.|รศ\.|ศ\.|พล\.ต\.|พ\.ต\.|ร\.ต\.|ต\.ต\.|ส\.ต\.)\s*/,
      "",
    )
    .trim();
}

/**
 * ฟอร์แมตชื่อเป็น: ชื่อ - นามสกุล (เว้นวรรค 2 ช่อง) โดยไม่รวมคำนำหน้า
 * (สามารถเปิด includePrefix: true หากต้องการรวมคำนำหน้าเหมือนเดิม)
 */
export function formatPersonName(parts: {
  prefix?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fallback?: string;
  includePrefix?: boolean;
}): string {
  const includePrefix = parts.includePrefix ?? false;
  const prefix = includePrefix ? String(parts.prefix ?? "").trim() : "";
  const firstName = String(parts.firstName ?? "").trim();
  const lastName = String(parts.lastName ?? "").trim();

  let firstOrTitleFirst = includePrefix ? `${prefix}${firstName}` : firstName;
  if (!includePrefix && firstOrTitleFirst) {
    firstOrTitleFirst = stripThaiPrefix(firstOrTitleFirst);
  }

  const full = [firstOrTitleFirst, lastName].filter(Boolean).join("  ");
  if (full) return full;

  if (parts.fallback) {
    return includePrefix ? parts.fallback : stripThaiPrefix(parts.fallback);
  }

  return "";
}
