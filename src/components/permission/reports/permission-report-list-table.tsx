import Link from "next/link";
import { formatThaiDate } from "@/lib/format/thai-date";
import type { PermissionReportListRow } from "@/lib/permission/reports/queries";
import { cn } from "@/lib/utils";

type PermissionReportListTableProps = {
  rows: PermissionReportListRow[];
  showSchool?: boolean;
  linkToDetail?: boolean;
};

export function PermissionReportListTable({
  rows,
  showSchool = true,
  linkToDetail = true,
}: PermissionReportListTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm print:border-black print:shadow-none">
      <table className="w-full min-w-[720px] text-sm print:text-xs">
        <thead>
          <tr className="border-b bg-muted/50 text-left print:bg-transparent">
            <th className="px-3 py-3 font-medium">ที่</th>
            <th className="px-3 py-3 font-medium">เลขที่</th>
            <th className="px-3 py-3 font-medium">ผู้ขอ</th>
            {showSchool ? (
              <th className="px-3 py-3 font-medium">หน่วยงาน</th>
            ) : null}
            <th className="px-3 py-3 font-medium">เรื่อง</th>
            <th className="px-3 py-3 font-medium">สถานที่</th>
            <th className="px-3 py-3 font-medium">ตั้งแต่วันที่</th>
            <th className="px-3 py-3 font-medium">ถึงวันที่</th>
            <th className="px-3 py-3 text-center font-medium">จำนวนวัน</th>
            <th className="px-3 py-3 text-center font-medium">สถานะ</th>
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
                <td className="px-3 py-2.5 font-mono text-xs">
                  {linkToDetail ? (
                    <Link
                      href={`/modules/permission/requests/${row.id}`}
                      className="text-primary hover:underline print:text-black print:no-underline"
                    >
                      {row.refId}
                    </Link>
                  ) : (
                    row.refId
                  )}
                </td>
                <td className="px-3 py-2.5">{row.displayName}</td>
                {showSchool ? (
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {row.schoolName ?? "เขตพื้นที่"}
                  </td>
                ) : null}
                <td className="px-3 py-2.5">{row.subject}</td>
                <td className="px-3 py-2.5">{row.place}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatThaiDate(row.travelStart)}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatThaiDate(row.travelFinish)}
                </td>
                <td className="px-3 py-2.5 text-center">{row.travelDays}</td>
                <td className="px-3 py-2.5 text-center text-xs">
                  {row.workflowLabel}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
