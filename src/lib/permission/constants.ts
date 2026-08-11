export function grantStatusLabel(grantStatus: number | null): string {
  if (grantStatus === 1) return "อนุมัติ";
  if (grantStatus === 0) return "ไม่อนุมัติ";
  return "รอพิจารณา";
}
export const basicGrantStatusLabel = grantStatusLabel;

export function permissionWorkflowStatusLabel(
  input:
    | { basicGrant?: number | null; groupGrant?: number | null; grantStatus?: number | null }
    | number
    | null,
): string {
  if (typeof input === "number" || input === null) {
    return grantStatusLabel(input);
  }
  if (input.grantStatus !== null && input.grantStatus !== undefined) {
    return grantStatusLabel(input.grantStatus);
  }
  if (input.groupGrant !== null && input.groupGrant !== undefined) {
    return grantStatusLabel(input.groupGrant);
  }
  if (input.basicGrant !== null && input.basicGrant !== undefined) {
    return grantStatusLabel(input.basicGrant);
  }
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

export const PERMISSION_VEHICLE_OPTIONS = [
  { value: "รถยนต์ส่วนบุคคล", label: "รถยนต์ส่วนบุคคล" },
  { value: "รถยนต์ส่วนกลาง", label: "รถยนต์ส่วนกลาง" },
  { value: "รถจักรยานยนต์", label: "รถจักรยานยนต์" },
  { value: "รถโดยสารประจำทาง", label: "รถโดยสารประจำทาง" },
  { value: "เครื่องบิน", label: "เครื่องบิน" },
  { value: "อื่นๆ", label: "อื่นๆ" },
];
