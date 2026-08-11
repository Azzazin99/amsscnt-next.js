import type { LeaveStatRow } from "@/lib/leave/form-context-shared";
import { cn } from "@/lib/utils";

type LeaveStatisticsTableProps = {
  rows: LeaveStatRow[];
  selectedLeaveType: number;
  relaxCollect: number | null;
  relaxThisYear: number | null;
  missingVacationServiceStart?: boolean;
  density?: "default" | "compact";
};

export function LeaveStatisticsTable({
  rows,
  selectedLeaveType,
  relaxCollect,
  relaxThisYear,
  missingVacationServiceStart = false,
  density = "default",
}: LeaveStatisticsTableProps) {
  const compact = density === "compact";

  return (
    <div className="space-y-2">
      <div>
        <p className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
          สถิติการลาในปีงบประมาณนี้
        </p>
        {compact ? (
          <p className="text-xs text-muted-foreground">หน่วย: วันทำการ</p>
        ) : null}
      </div>

      {compact ? (
        <table className="w-full table-fixed text-xs">
          <colgroup>
            <col className="w-[38%]" />
            <col className="w-[20%]" />
            <col className="w-[22%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr className="border-b bg-muted/40">
              <th
                scope="col"
                className="px-1.5 py-1.5 text-left font-medium"
              >
                ประเภท
              </th>
              <th
                scope="col"
                className="px-1 py-1.5 text-center font-medium"
                title="ลามาแล้ว (วันทำการ)"
              >
                <abbr title="ลามาแล้ว (วันทำการ)" className="no-underline">
                  มาแล้ว
                </abbr>
              </th>
              <th
                scope="col"
                className="px-1 py-1.5 text-center font-medium"
                title="ลาครั้งนี้ (วันทำการ)"
              >
                <abbr title="ลาครั้งนี้ (วันทำการ)" className="no-underline">
                  ครั้งนี้
                </abbr>
              </th>
              <th
                scope="col"
                className="px-1 py-1.5 text-center font-medium"
                title="รวมเป็น (วันทำการ)"
              >
                <abbr title="รวมเป็น (วันทำการ)" className="no-underline">
                  รวม
                </abbr>
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
                <td className="px-1.5 py-1.5 leading-snug">{row.label}</td>
                <td className="px-1 py-1.5 text-center tabular-nums">
                  {row.ago}
                </td>
                <td className="px-1 py-1.5 text-center tabular-nums">
                  {row.thisTime}
                </td>
                <td className="px-1 py-1.5 text-center tabular-nums">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:overflow-visible sm:px-0">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-2 py-2 text-left font-medium sm:px-3">
                  ประเภทการลา
                </th>
                <th className="px-2 py-2 text-center font-medium sm:px-3">
                  ลามาแล้ว
                  <span className="block text-xs font-normal text-muted-foreground">
                    (วันทำการ)
                  </span>
                </th>
                <th className="px-2 py-2 text-center font-medium sm:px-3">
                  ลาครั้งนี้
                  <span className="block text-xs font-normal text-muted-foreground">
                    (วันทำการ)
                  </span>
                </th>
                <th className="px-2 py-2 text-center font-medium sm:px-3">
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
                  <td className="px-2 py-2 sm:px-3">{row.label}</td>
                  <td className="px-2 py-2 text-center tabular-nums sm:px-3">
                    {row.ago}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums sm:px-3">
                    {row.thisTime}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums sm:px-3">
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {relaxCollect !== null ||
      relaxThisYear !== null ||
      missingVacationServiceStart ? (
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
