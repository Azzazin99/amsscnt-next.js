import type { CSSProperties } from "react";
type CellLayoutOptions = {
  isHeader: boolean;
  isEvenRow?: boolean;
};

/** ความกว้างคอลัมน์ — action ไม่ใช้ sticky (เลื่อนตามตารางปกติ) */
export function getBookregisterCellLayout(
  columnId: string,
  width: number,
  _sizing: unknown,
  { isHeader, isEvenRow = true }: CellLayoutOptions,
): { className?: string; style: CSSProperties } {
  const baseStyle: CSSProperties = {
    width,
    minWidth: width,
    maxWidth: width,
    boxSizing: "border-box",
  };

  return { style: baseStyle };
}
