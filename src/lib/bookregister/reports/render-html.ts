import {
  formatCommandReportCells,
  formatReceiveReportCells,
  formatSendReportCells,
} from "@/lib/bookregister/reports/format-cells";
import {
  type RegisterReportKind,
  reportColumnsForKind,
  REPORT_TITLES,
} from "@/lib/bookregister/reports/columns";
import type {
  CommandReportRow,
  ReceiveReportRow,
  SendReportRow,
} from "@/lib/bookregister/reports/queries";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function alignAttr(align?: "left" | "center" | "right"): string {
  if (!align || align === "left") return "";
  return ` align="${align}"`;
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

export type RegisterReportHtmlOptions = {
  kind: RegisterReportKind;
  year: number;
  officeName: string;
  rows: ReceiveReportRow[] | SendReportRow[] | CommandReportRow[];
  forExcel?: boolean;
};

export function renderRegisterReportHtml({
  kind,
  year,
  officeName,
  rows,
  forExcel = false,
}: RegisterReportHtmlOptions): string {
  const columns = reportColumnsForKind(kind);
  const meta = REPORT_TITLES[kind];
  const formattedRows = formatRows(kind, rows);
  const headerBg =
    kind === "receive" ? "#FFCCCC" : kind === "send" ? "#99FFFF" : "#FFFF66";

  const headCells = columns
    .map(
      (col) =>
        `<th${alignAttr(col.align)}${col.width ? ` width="${col.width}"` : ""}><font face="Tahoma" size="2">${escapeHtml(col.header)}</font></th>`,
    )
    .join("");

  const bodyRows = formattedRows
    .map((cells, index) => {
      const bg = index % 2 === 0 ? "#FFFFCC" : "#ffffff";
      const tds = columns
        .map(
          (col) =>
            `<td${alignAttr(col.align)}>${escapeHtml(cells[col.id] ?? "")}</td>`,
        )
        .join("");
      return `<tr bgcolor="${bg}">${tds}</tr>`;
    })
    .join("");

  const titleBlock = forExcel
    ? ""
    : `<p style="text-align:center;margin:0 0 8px"><strong>${escapeHtml(officeName)}</strong></p>
<p style="text-align:center;margin:0 0 4px"><strong>${escapeHtml(meta.title)} ประจำปี ${year}</strong></p>
<p style="text-align:center;margin:0 0 12px;font-size:12px">${escapeHtml(meta.subtitle)}</p>`;

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
${forExcel ? "" : `<style>
@media print {
  @page { size: landscape; margin: 12mm; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .no-print { display: none !important; }
}
table { border-collapse: collapse; width: 100%; font-family: Tahoma, sans-serif; font-size: 12px; }
th, td { border: 1px solid #333; padding: 4px 6px; vertical-align: top; }
th { background: ${headerBg}; }
</style>`}
</head>
<body>
${titleBlock}
<table border="1" cellspacing="0" cellpadding="4">
<thead><tr bgcolor="${headerBg}">${headCells}</tr></thead>
<tbody>${bodyRows}</tbody>
</table>
<p style="margin-top:8px;font-size:11px">จำนวน ${formattedRows.length} รายการ — พิมพ์เมื่อ ${escapeHtml(new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }))}</p>
</body>
</html>`;
}

export function registerReportFilename(
  kind: RegisterReportKind,
  year: number,
): string {
  return `${kind}_${year}.xls`;
}
