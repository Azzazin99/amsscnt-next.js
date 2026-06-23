/** คำนำหน้าต่อชื่อไม่เว้นวรรค · นามสกุลเว้น 2 ช่อง — ตามสไตล์ legacy AMSS */
export function formatPersonName(parts: {
  prefix?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fallback?: string;
}): string {
  const prefix = String(parts.prefix ?? "").trim();
  const firstName = String(parts.firstName ?? "").trim();
  const lastName = String(parts.lastName ?? "").trim();

  const titleAndFirst = `${prefix}${firstName}`;
  const full = [titleAndFirst, lastName].filter(Boolean).join("  ");

  return full || parts.fallback || "";
}
