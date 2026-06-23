/** เส้นทาง admin ที่ปิดชั่วคราว (ว่าง = เปิดทั้งหมด) */
export const DISABLED_ADMIN_PREFIXES = [] as const;

export function isDisabledAdminPath(pathname: string): boolean {
  const normalized = pathname.split("?")[0]?.replace(/\/$/, "") || pathname;
  return DISABLED_ADMIN_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}
