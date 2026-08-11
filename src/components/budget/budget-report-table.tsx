import { formatMoney } from "@/lib/budget/constants";
import type { ReportColumn, ReportRow } from "@/lib/budget/report-queries";
import { formatThaiDate } from "@/lib/format/thai-date";

type BudgetReportTableProps = {
  columns: ReportColumn[];
  rows: ReportRow[];
  emptyMessage?: string;
  showTotals?: boolean;
};

/** จัดรูปแบบค่าตาม key: *Date → พ.ศ., คอลัมน์ตัวเลขชิดขวา → เงิน */
function renderCell(col: ReportColumn, value: string | number | null) {
  if (value == null || value === "") return "—";
  if (/date/i.test(col.key) && typeof value === "string") {
    return formatThaiDate(value);
  }
  if (col.align === "right" && typeof value === "number") {
    return formatMoney(value);
  }
  return String(value);
}

export function BudgetReportTable({
  columns,
  rows,
  emptyMessage = "ไม่พบข้อมูล",
  showTotals = true,
}: BudgetReportTableProps) {
  let totalsRow: Record<string, number | string> | null = null;

  if (showTotals && rows.length > 0) {
    const calc: Record<string, number | string> = {};
    let sumMoney = 0;
    let sumWithdraw = 0;
    let sumReturn = 0;

    columns.forEach((col, idx) => {
      if (idx === 0) {
        calc[col.key] = "รวมทั้งสิ้น";
      } else if (col.align === "right") {
        if (col.key !== "percent") {
          const sum = rows.reduce((acc, r) => {
            const v = r[col.key];
            return acc + (typeof v === "number" ? v : 0);
          }, 0);
          calc[col.key] = sum;
          if (col.key === "money") sumMoney = sum;
          if (col.key === "withdraw") sumWithdraw = sum;
          if (col.key === "moneyReturn") sumReturn = sum;
        }
      }
    });

    if (columns.some((c) => c.key === "percent")) {
      const pct = sumMoney > 0 ? ((sumWithdraw - sumReturn) / sumMoney) * 100 : 0;
      calc.percent = Number(pct.toFixed(2));
    }

    totalsRow = calc;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm border-collapse">
        <thead>
          <tr className="border-b bg-muted/60 text-foreground font-semibold">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 ${
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                      ? "text-center"
                      : "text-left"
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className="even:bg-muted/15 odd:bg-card hover:bg-accent/40 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-2.5 ${
                      col.align === "right"
                        ? "text-right whitespace-nowrap font-mono text-xs sm:text-sm"
                        : col.align === "center"
                          ? "text-center"
                          : "text-left"
                    }`}
                  >
                    {renderCell(col, row[col.key] ?? null)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {totalsRow ? (
          <tfoot>
            <tr className="border-t-2 border-primary/20 bg-muted/50 font-semibold text-foreground">
              {columns.map((col, idx) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 ${
                    col.align === "right"
                      ? "text-right whitespace-nowrap font-mono text-xs sm:text-sm"
                      : idx === 0
                        ? "text-center"
                        : "text-left"
                  }`}
                >
                  {col.key in totalsRow
                    ? renderCell(col, totalsRow[col.key])
                    : ""}
                </td>
              ))}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
