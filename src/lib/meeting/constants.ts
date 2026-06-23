export const MEETING_TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i + 1;
  const label = `${String(hour).padStart(2, "0")}.00 น.`;
  return { value: hour, label };
});

export function meetingTimeLabel(time: number): string {
  const opt = MEETING_TIME_OPTIONS.find((o) => o.value === time);
  return opt?.label ?? `${time}.00 น.`;
}

export function approveStatusLabel(approve: number | null): string {
  if (approve === 1) return "อนุมัติ";
  if (approve === 2) return "ไม่อนุมัติ";
  return "รอพิจารณา";
}
