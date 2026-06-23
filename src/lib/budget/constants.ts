export const BUDGET_TYPE_MAIN = 200;

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
