import {
  formatCommandReportCells,
  formatReceiveReportCells,
  formatSendReportCells,
} from "@/lib/bookregister/reports/format-cells";
import {
  type RegisterReportColumn,
  type RegisterReportKind,
  reportColumnsForKind,
  REPORT_TITLES,
} from "@/lib/bookregister/reports/columns";
import type {
  CommandReportRow,
  ReceiveReportRow,
  SendReportRow,
} from "@/lib/bookregister/reports/queries";

type RegisterReportTableProps = {
  kind: RegisterReportKind;
  year: number;
  officeName: string;
  rows: ReceiveReportRow[] | SendReportRow[] | CommandReportRow[];
};

function formatRow(
  kind: RegisterReportKind,
  row: ReceiveReportRow | SendReportRow | CommandReportRow,
  seq: number,
): Record<string, string> {
  if (kind === "command") {
    return formatCommandReportCells(row as CommandReportRow, seq);
  }
  if (kind === "send") {
    return formatSendReportCells(row as SendReportRow, seq);
  }
  return formatReceiveReportCells(row as ReceiveReportRow, seq);
}

function headerClass(kind: RegisterReportKind): string {
  if (kind === "receive") return "bg-[#FFCCCC] text-neutral-900";
  if (kind === "send") return "bg-[#99FFFF] text-neutral-900";
  return "bg-[#FFFF66] text-neutral-900";
}

/** สีแถวสลับ — ตรง legacy / HTML export (ไม่ใช้ token ธีม เพราะ preview ต้องเหมือนกระดาษพิมพ์) */
function rowClass(index: number): string {
  return index % 2 === 0 ? "bg-[#FFFFCC]/60" : "bg-white";
}

function Cell({
  column,
  value,
}: {
  column: RegisterReportColumn;
  value: string;
}) {
  const align =
    column.align === "center"
      ? "text-center"
      : column.align === "right"
        ? "text-right"
        : "text-left";

  return (
    <td
      className={`border border-neutral-400 px-2 py-1 align-top text-neutral-900 ${align}`}
    >
      {value || "\u00a0"}
    </td>
  );
}

export function RegisterReportTable({
  kind,
  year,
  officeName,
  rows,
}: RegisterReportTableProps) {
  const columns = reportColumnsForKind(kind);
  const meta = REPORT_TITLES[kind];
  const headerBg = headerClass(kind);

  return (
    <div className="register-report overflow-x-auto rounded-lg border border-neutral-200 bg-white p-4 text-neutral-900 shadow-sm dark:border-neutral-300 dark:bg-white dark:text-neutral-900">
      <header className="mb-4 text-center">
        <p className="text-base font-semibold text-neutral-900">{officeName}</p>
        <h2 className="mt-1 text-lg font-semibold text-neutral-900">
          {meta.title} ประจำปี {year}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">{meta.subtitle}</p>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
          ไม่มีรายการในปี {year}
        </p>
      ) : (
        <table className="w-full min-w-[960px] border-collapse text-xs text-neutral-900 md:text-sm">
          <thead>
            <tr className={headerBg}>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="border border-neutral-400 px-2 py-1.5 font-semibold text-neutral-900"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const cells = formatRow(kind, row, index + 1);

              return (
                <tr
                  key={`${row.registerNumber}-${row.year}`}
                  className={rowClass(index)}
                >
                  {columns.map((col) => (
                    <Cell
                      key={col.id}
                      column={col}
                      value={cells[col.id] ?? ""}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
