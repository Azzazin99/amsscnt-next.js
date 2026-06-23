export function grantStatusLabel(grantStatus: number | null): string {
  if (grantStatus === 1) return "อนุมัติ";
  if (grantStatus === 0) return "ไม่อนุมัติ";
  return "รอพิจารณา";
}

export function computeTravelDays(travelStart: string, travelFinish: string): number {
  const start = new Date(`${travelStart}T00:00:00`);
  const finish = new Date(`${travelFinish}T00:00:00`);
  const diffMs = finish.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export function generatePermissionRefId(): string {
  return `PR${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
