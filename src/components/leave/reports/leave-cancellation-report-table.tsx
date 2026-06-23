import Link from "next/link";
import { formatThaiDate } from "@/lib/format/thai-date";
import type { LeaveCancellationReportRow } from "@/lib/leave/reports/types";
import { cn } from "@/lib/utils";

type LeaveCancellationReportTableProps = {
  rows: LeaveCancellationReportRow[];
};

export function LeaveCancellationReportTable({
  rows,
}: LeaveCancellationReportTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm print:border-black print:shadow-none">
      <table className="w-full min-w-[680px] text-sm print:text-xs">
        <thead>
          <tr className="border-b bg-muted/50 text-left print:bg-transparent">
            <th className="px-3 py-3 font-medium">ที่</th>
            <th className="px-3 py-3 font-medium">เลขที่</th>
            <th className="px-3 py-3 font-medium">ผู้ขออนุญาต</th>
            <th className="px-3 py-3 font-medium">วันขออนุญาต</th>
            <th className="px-3 py-3 font-medium">ประเภทการลา</th>
            <th className="px-3 py-3 font-medium">ตั้งแต่วันที่</th>
            <th className="px-3 py-3 font-medium">ถึงวันที่</th>
            <th className="px-3 py-3 text-center font-medium">มีกำหนด</th>
            <th className="px-3 py-3 text-center font-medium">อนุมัติ</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                className="px-3 py-8 text-center text-muted-foreground"
              >
                ไม่มีรายการ
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row.id}
                className={cn(
                  index % 2 === 0 ? "bg-card" : "bg-muted/20",
                  "print:bg-white",
                )}
              >
                <td className="px-3 py-2.5">{index + 1}</td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/modules/leave/cancellations/${row.id}`}
                    className="text-primary hover:underline print:text-black print:no-underline"
                  >
                    {row.id}
                  </Link>
                </td>
                <td className="px-3 py-2.5">{row.displayName}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {row.requestDate ? formatThaiDate(row.requestDate) : "—"}
                </td>
                <td className="px-3 py-2.5">{row.leaveTypeLabel}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatThaiDate(row.cancelStart)}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatThaiDate(row.cancelFinish)}
                </td>
                <td className="px-3 py-2.5 text-center">{row.cancelTotal}</td>
                <td className="px-3 py-2.5 text-center">{row.grantLabel}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
