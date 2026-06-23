import Link from "next/link";
import { formatThaiDate } from "@/lib/format/thai-date";
import type { LeaveReportListRow } from "@/lib/leave/reports/types";
import { cn } from "@/lib/utils";

type LeaveReportListTableProps = {
  rows: LeaveReportListRow[];
  showSchool?: boolean;
};

export function LeaveReportListTable({
  rows,
  showSchool = true,
}: LeaveReportListTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm print:border-black print:shadow-none">
      <table className="w-full min-w-[720px] text-sm print:text-xs">
        <thead>
          <tr className="border-b bg-muted/50 text-left print:bg-transparent">
            <th className="px-3 py-3 font-medium">ที่</th>
            <th className="px-3 py-3 font-medium">เลขที่</th>
            <th className="px-3 py-3 font-medium">ผู้ขออนุญาต</th>
            {showSchool ? (
              <th className="px-3 py-3 font-medium">หน่วยงาน</th>
            ) : null}
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
                colSpan={showSchool ? 10 : 9}
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
                    href={`/modules/leave/requests/${row.id}`}
                    className="text-primary hover:underline print:text-black print:no-underline"
                  >
                    {row.id}
                  </Link>
                </td>
                <td className="px-3 py-2.5">{row.displayName}</td>
                {showSchool ? (
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {row.schoolName ?? "—"}
                  </td>
                ) : null}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {row.requestDate ? formatThaiDate(row.requestDate) : "—"}
                </td>
                <td className="px-3 py-2.5">{row.leaveTypeLabel}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatThaiDate(row.leaveStart)}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatThaiDate(row.leaveFinish)}
                </td>
                <td className="px-3 py-2.5 text-center">{row.leaveTotal}</td>
                <td className="px-3 py-2.5 text-center">{row.grantLabel}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
