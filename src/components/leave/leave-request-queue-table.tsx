import Link from "next/link";
import { formatThaiDate } from "@/lib/format/thai-date";
import type { LeaveInboxRow } from "@/lib/leave/inbox-queries";
import { cn } from "@/lib/utils";

type LeaveRequestQueueTableProps = {
  rows: LeaveInboxRow[];
  showSchool?: boolean;
  renderRowAction?: (row: LeaveInboxRow) => React.ReactNode;
  detailLabel?: string;
  getDetailHref?: (row: LeaveInboxRow) => string;
  dateColumnLabel?: string;
};

export function LeaveRequestQueueTable({
  rows,
  showSchool = true,
  renderRowAction,
  detailLabel = "พิจารณา",
  getDetailHref,
  dateColumnLabel = "วันที่ลา",
}: LeaveRequestQueueTableProps) {
  const colSpan = (showSchool ? 7 : 6) + 1;

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-3 py-3 font-medium">ผู้ลา</th>
            {showSchool ? (
              <th className="px-3 py-3 font-medium">หน่วยงาน</th>
            ) : null}
            <th className="px-3 py-3 font-medium">ประเภท</th>
            <th className="px-3 py-3 font-medium">{dateColumnLabel}</th>
            <th className="px-3 py-3 text-center font-medium">จำนวนวัน</th>
            <th className="px-3 py-3 text-center font-medium">สถานะ</th>
            <th className="px-3 py-3 text-center font-medium">ดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={colSpan}
                className="px-3 py-8 text-center text-muted-foreground"
              >
                ไม่มีรายการ
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.id}
                className={cn(i % 2 === 0 ? "bg-card" : "bg-muted/20")}
              >
                <td className="px-3 py-2.5">
                  <div>{row.displayName}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {row.personId}
                  </div>
                </td>
                {showSchool ? (
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {row.schoolName ?? "เขตพื้นที่"}
                  </td>
                ) : null}
                <td className="px-3 py-2.5">{row.leaveTypeLabel}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatThaiDate(row.leaveStart)} – {formatThaiDate(row.leaveFinish)}
                </td>
                <td className="px-3 py-2.5 text-center">{row.leaveTotal}</td>
                <td className="px-3 py-2.5 text-center text-muted-foreground">
                  {row.workflowStatusLabel}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {renderRowAction ? (
                    renderRowAction(row)
                  ) : (
                    <Link
                      href={
                        getDetailHref?.(row) ??
                        `/modules/leave/requests/${row.id}`
                      }
                      className="text-primary hover:underline"
                    >
                      {detailLabel}
                    </Link>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
