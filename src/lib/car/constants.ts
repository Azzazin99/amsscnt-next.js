export const CAR_VEHICLE_STATUS: Record<number, string> = {
  1: "ใช้งานเฉพาะ",
  2: "อนุญาตให้จองใช้งาน",
  3: "เคยใช้งาน",
};

export const CAR_VEHICLE_STATUS_OPTIONS = Object.entries(CAR_VEHICLE_STATUS).map(
  ([value, label]) => ({ value: Number(value), label }),
);

export const CAR_FUEL_OPTIONS = [
  { value: 0, label: "ไม่ขอใช้งบประมาณ" },
  { value: 1, label: "ขอใช้จากงบเชื้อเพลิงกลางของ สพท." },
  { value: 2, label: "ขอใช้จากงบเชื้อเพลิงจากโครงการ" },
] as const;

export const CAR_PERMISSION_ROLES: Record<number, string> = {
  1: "เจ้าหน้าที่",
  2: "ผู้ให้ความเห็นชอบ",
  3: "ผู้อนุมัติ",
};

export const CAR_PERMISSION_ROLE_OPTIONS = Object.entries(
  CAR_PERMISSION_ROLES,
).map(([value, label]) => ({ value: Number(value), label }));

export function vehicleStatusLabel(status: number): string {
  return CAR_VEHICLE_STATUS[status] ?? `สถานะ ${status}`;
}

export function grantStatusLabel(commanderGrant: number | null): string {
  if (commanderGrant === 1) return "อนุมัติ";
  if (commanderGrant === 0) return "ไม่อนุมัติ";
  return "รอพิจารณา";
}

export function permissionRoleLabel(p1: number): string {
  return CAR_PERMISSION_ROLES[p1] ?? "—";
}

export function computeDayTotal(carStart: string, carFinish: string): number {
  const start = new Date(`${carStart}T00:00:00`);
  const finish = new Date(`${carFinish}T00:00:00`);
  const diffMs = finish.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export function fuelLabel(fuel: number): string {
  return CAR_FUEL_OPTIONS.find((o) => o.value === fuel)?.label ?? `เชื้อเพลิง ${fuel}`;
}
