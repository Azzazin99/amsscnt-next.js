import type { ReactNode } from "react";

export type BookregisterColumnSizing = Record<string, number>;

export type BookregisterListColumn<TRow> = {
  id: string;
  header: ReactNode;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  /** ค่าเริ่มต้น true */
  resizable?: boolean;
  headerNowrap?: boolean;
  compact?: boolean;
  alignCenter?: boolean;
  render: (row: TRow) => ReactNode;
};
