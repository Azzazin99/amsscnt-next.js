import type { BookregisterColumnSizing } from "@/components/bookregister/bookregister-list-column";

export const BOOKREGISTER_ACTION_COLUMN_WIDTH = 52;

export const BOOKREGISTER_ACTION_COLUMN_MIN_WIDTH = 48;
export const BOOKREGISTER_ACTION_COLUMN_MAX_WIDTH = 80;

/** ลำดับซ้าย → ขวา: ดู, แก้ไข, ลบ */
export const BOOKREGISTER_ACTION_COLUMN_IDS = [
  "actionView",
  "actionEdit",
  "actionDelete",
] as const;

export type BookregisterActionColumnId =
  (typeof BOOKREGISTER_ACTION_COLUMN_IDS)[number];

export function isBookregisterActionColumn(
  columnId: string,
): columnId is BookregisterActionColumnId {
  return (BOOKREGISTER_ACTION_COLUMN_IDS as readonly string[]).includes(
    columnId,
  );
}

function actionColumnWidth(
  columnId: BookregisterActionColumnId,
  columnSizing: BookregisterColumnSizing,
): number {
  return columnSizing[columnId] ?? BOOKREGISTER_ACTION_COLUMN_WIDTH;
}

/** ความกว้างรวมคอลัมน์ action ทั้ง 3 */
export function bookregisterActionColumnsTotalWidth(
  columnSizing: BookregisterColumnSizing = {},
): number {
  return BOOKREGISTER_ACTION_COLUMN_IDS.reduce(
    (sum, id) => sum + actionColumnWidth(id, columnSizing),
    0,
  );
}

export const bookregisterActionColumnBase = {
  defaultWidth: BOOKREGISTER_ACTION_COLUMN_WIDTH,
  minWidth: BOOKREGISTER_ACTION_COLUMN_MIN_WIDTH,
  maxWidth: BOOKREGISTER_ACTION_COLUMN_MAX_WIDTH,
  compact: true,
  alignCenter: true,
} as const;
