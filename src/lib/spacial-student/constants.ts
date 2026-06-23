export const SPACIAL_DISABLE_TYPES = [
  { value: 1, label: "บกพร่องทางการเห็น" },
  { value: 2, label: "บกพร่องทางการได้ยิน" },
  { value: 3, label: "บกพร่องทางสติปัญญา" },
  { value: 4, label: "บกพร่องทางร่างกาย" },
  { value: 5, label: "มีปัญหาทางการเรียนรู้" },
  { value: 6, label: "บกพร่องทางการพูดและภาษา" },
  { value: 7, label: "มีปัญหาทางพฤติกรรมหรืออารมณ์" },
  { value: 8, label: "ออทิสติก" },
  { value: 9, label: "พิการซ้ำซ้อน" },
] as const;

export function disableTypeLabel(disableType: number): string {
  return (
    SPACIAL_DISABLE_TYPES.find((t) => t.value === disableType)?.label ??
    `#${disableType}`
  );
}
