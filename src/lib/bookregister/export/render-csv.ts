import {
  formatCommandReportCells,
  formatReceiveReportCells,
  formatSendReportCells,
} from "@/lib/bookregister/reports/format-cells";
import {
  type RegisterReportColumn,
  type RegisterReportKind,
  reportColumnsForKind,
} from "@/lib/bookregister/reports/columns";
import type {
  CommandReportRow,
  ReceiveReportRow,
  SendReportRow,
} from "@/lib/bookregister/reports/queries";

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatRows(
  kind: RegisterReportKind,
  rows: ReceiveReportRow[] | SendReportRow[] | CommandReportRow[],
): Record<string, string>[] {
  if (kind === "command") {
    return (rows as CommandReportRow[]).map((row, index) =>
      formatCommandReportCells(row, index + 1),
    );
  }
  if (kind === "send") {
    return (rows as SendReportRow[]).map((row, index) =>
      formatSendReportCells(row, index + 1),
    );
  }
  return (rows as ReceiveReportRow[]).map((row, index) =>
    formatReceiveReportCells(row, index + 1),
  );
}

export function renderRegisterCsv(
  kind: RegisterReportKind,
  rows: ReceiveReportRow[] | SendReportRow[] | CommandReportRow[],
): string {
  const columns: RegisterReportColumn[] = reportColumnsForKind(kind);
  const formattedRows = formatRows(kind, rows);
  const header = columns.map((col) => escapeCsv(col.header)).join(",");
  const body = formattedRows
    .map((cells) =>
      columns.map((col) => escapeCsv(cells[col.id] ?? "")).join(","),
    )
    .join("\n");
  return `\uFEFF${header}\n${body}\n`;
}

export function registerCsvFilename(
  kind: RegisterReportKind,
  year: number,
): string {
  return `${kind}_${year}.csv`;
}
