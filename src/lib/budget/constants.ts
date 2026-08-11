export const BUDGET_TYPE_MAIN = 200;

export type BudgetMoneyKind = "budget" | "extra" | "income";

export const BUDGET_RECEIVE_STATUS: Record<number, string> = {
  1: "รับเงินสด",
  2: "รับเช็ค/เงินฝากธนาคาร",
};

export function receiveStatusLabel(status: number | null): string {
  if (status == null) return "—";
  return BUDGET_RECEIVE_STATUS[status] ?? String(status);
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const BUDGET_KIND_CATEGORY: Record<string, number> = {
  budget: 2,
  extra: 1,
  income: 3,
};

export const PAY_GROUPS: Record<number, string> = {
  1: "งบบุคลากร",
  2: "งบดำเนินงาน",
  3: "งบลงทุน",
  4: "งบอุดหนุน",
  5: "งบรายจ่ายอื่น",
};
export const BUDGET_PAY_GROUPS = PAY_GROUPS;

export const BUDGET_CHANGE_STATUS: Record<number, string> = {
  3: "นำเงินสดฝากธนาคาร",
  4: "นำเงินสดฝากส่วนราชการผู้เบิก",
  5: "ถอนเงินฝากธนาคารเป็นเงินสด",
  6: "ถอนเงินฝากธนาคารไปฝากส่วนราชการผู้เบิก",
  7: "รับคืนเงินฝากส่วนราชการผู้เบิกมาเป็นเงินสด",
  8: "รับคืนเงินฝากส่วนราชการมาเป็นเงินธนาคาร",
};

export function changeStatusLabel(status: number | null): string {
  if (status == null) return "—";
  return BUDGET_CHANGE_STATUS[status] ?? String(status);
}

export type BudgetPermissionFieldKey =
  | "p1"
  | "p2"
  | "p3"
  | "p4"
  | "p5"
  | "p6"
  | "p7"
  | "p8"
  | "p9"
  | "p10";

export const BUDGET_PERMISSION_FIELDS: {
  key: BudgetPermissionFieldKey;
  name: BudgetPermissionFieldKey;
  label: string;
  shortLabel: string;
}[] = [
  { key: "p1", name: "p1", label: "ผู้อนุมัติ", shortLabel: "ผู้อนุมัติ" },
  { key: "p2", name: "p2", label: "ทะเบียนเงินงวด", shortLabel: "เงินงวด" },
  { key: "p3", name: "p3", label: "ทะเบียนขอเบิก", shortLabel: "ขอเบิก" },
  { key: "p4", name: "p4", label: "ทะเบียนฎีกา", shortLabel: "วางฎีกา" },
  { key: "p5", name: "p5", label: "ทะเบียนเงินงบประมาณ", shortLabel: "เงินงบประมาณ" },
  { key: "p6", name: "p6", label: "ทะเบียนเงินนอกงบประมาณ", shortLabel: "เงินนอกงบประมาณ" },
  { key: "p7", name: "p7", label: "ทะเบียนเงินรายได้แผ่นดิน", shortLabel: "เงินรายได้แผ่นดิน" },
  { key: "p8", name: "p8", label: "ทะเบียนเงินทดรองราชการ", shortLabel: "เงินทดรองราชการ" },
  { key: "p9", name: "p9", label: "จ่ายเงิน", shortLabel: "จ่ายเงิน" },
  { key: "p10", name: "p10", label: "ดูรายงาน", shortLabel: "ดูรายงาน" },
];

export function payGroupLabel(group: number | null): string {
  if (group == null) return "—";
  return PAY_GROUPS[group] ?? String(group);
}
