import Link from "next/link";
import { formatThaiDate } from "@/lib/format/thai-date";
import type { PermissionListRow } from "@/lib/permission/queries";
import { cn } from "@/lib/utils";

type PermissionRegisterTableProps = {
  rows: PermissionListRow[];
};

function grantBadgeClass(grant: number | null): string {
  if (grant === 1) {
    return "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200";
  }
  if (grant === 0) {
    return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200";
}

export function PermissionRegisterTable({ rows }: PermissionRegisterTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-3 py-3 font-medium">เลขที่</th>
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
                colSpan={7}
                className="px-3 py-8 text-center text-muted-foreground"
              >
                ไม่พบคำขอไปราชการ
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row.id}
                className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
              >
                <td className="px-3 py-2.5 font-mono text-xs">
                  <Link
                    href={`/modules/permission/requests/${row.id}`}
                    className="text-primary hover:underline"
                  >
                    {row.refId}
                  </Link>
                </td>
                <td className="px-3 py-2.5">{row.subject}</td>
                <td className="px-3 py-2.5">{row.place}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatThaiDate(row.travelStart)}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatThaiDate(row.travelFinish)}
                </td>
                <td className="px-3 py-2.5 text-center">{row.travelDays}</td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      grantBadgeClass(row.grantStatus),
                    )}
                  >
                    {row.workflowStatusLabel}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
