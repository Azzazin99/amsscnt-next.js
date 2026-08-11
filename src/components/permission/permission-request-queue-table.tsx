import Link from "next/link";
import { formatThaiDate } from "@/lib/format/thai-date";
import type { PermissionInboxRow } from "@/lib/permission/inbox-queries";
import { cn } from "@/lib/utils";

type PermissionRequestQueueTableProps = {
  rows: PermissionInboxRow[];
  showSchool?: boolean;
};

export function PermissionRequestQueueTable({
  rows,
  showSchool = true,
}: PermissionRequestQueueTableProps) {
  const colSpan = (showSchool ? 6 : 5) + 1;

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-3 py-3 font-medium">ผู้ขอ</th>
            {showSchool ? (
              <th className="px-3 py-3 font-medium">หน่วยงาน</th>
            ) : null}
            <th className="px-3 py-3 font-medium">เรื่อง</th>
            <th className="px-3 py-3 font-medium">ช่วงวันไปราชการ</th>
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
                <td className="px-3 py-2.5">
                  <div>{row.subject}</div>
                  <div className="text-xs text-muted-foreground">{row.place}</div>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatThaiDate(row.travelStart)} –{" "}
                  {formatThaiDate(row.travelFinish)}
                </td>
                <td className="px-3 py-2.5 text-center">{row.travelDays}</td>
                <td className="px-3 py-2.5 text-center text-xs">
                  {row.workflowStatusLabel}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <Link
                    href={`/modules/permission/requests/${row.id}`}
                    className="text-primary hover:underline"
                  >
                    พิจารณา
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
