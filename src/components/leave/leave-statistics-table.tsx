import type { LeaveStatRow } from "@/lib/leave/form-context-shared";
import { cn } from "@/lib/utils";

type LeaveStatisticsTableProps = {
  rows: LeaveStatRow[];
  selectedLeaveType: number;
  relaxCollect: number | null;
  relaxThisYear: number | null;
  missingVacationServiceStart?: boolean;
};

export function LeaveStatisticsTable({
  rows,
  selectedLeaveType,
  relaxCollect,
  relaxThisYear,
  missingVacationServiceStart = false,
}: LeaveStatisticsTableProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">สถิติการลาในปีงบประมาณนี้</p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[28rem] text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-3 py-2 text-left font-medium">ประเภทการลา</th>
              <th className="px-3 py-2 text-center font-medium">
                ลามาแล้ว
                <span className="block text-xs font-normal text-muted-foreground">
                  (วันทำการ)
                </span>
              </th>
              <th className="px-3 py-2 text-center font-medium">
                ลาครั้งนี้
                <span className="block text-xs font-normal text-muted-foreground">
                  (วันทำการ)
                </span>
              </th>
              <th className="px-3 py-2 text-center font-medium">
                รวมเป็น
                <span className="block text-xs font-normal text-muted-foreground">
                  (วันทำการ)
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.leaveType}
                className={cn(
                  "border-b last:border-b-0",
                  selectedLeaveType === row.leaveType && "bg-primary/5",
                )}
              >
                <td className="px-3 py-2">{row.label}</td>
                <td className="px-3 py-2 text-center tabular-nums">{row.ago}</td>
                <td className="px-3 py-2 text-center tabular-nums">
                  {row.thisTime}
                </td>
                <td className="px-3 py-2 text-center tabular-nums">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {relaxCollect !== null || relaxThisYear !== null || missingVacationServiceStart ? (
        <p className="text-xs text-muted-foreground">
          ลาพักผ่อน — สะสม {relaxCollect ?? 0} วัน · สิทธิปีนี้{" "}
          {missingVacationServiceStart
            ? "— (ระบุวันเริ่มราชการก่อน)"
            : relaxThisYear !== null
              ? `${relaxThisYear} วัน`
              : "—"}
        </p>
      ) : null}
    </div>
  );
}
