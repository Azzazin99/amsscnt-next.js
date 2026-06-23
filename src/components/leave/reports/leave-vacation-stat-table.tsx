import type { LeaveVacationStatRow } from "@/lib/leave/reports/types";
import { cn } from "@/lib/utils";

type LeaveVacationStatTableProps = {
  rows: LeaveVacationStatRow[];
};

export function LeaveVacationStatTable({ rows }: LeaveVacationStatTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm print:border-black print:shadow-none">
      <table className="w-full min-w-[900px] text-sm print:text-xs">
        <thead>
          <tr className="border-b bg-muted/50 text-center print:bg-transparent">
            <th className="px-2 py-2 font-medium" rowSpan={2}>
              ที่
            </th>
            <th className="px-2 py-2 font-medium" rowSpan={2}>
              ชื่อ
            </th>
            <th className="px-2 py-2 font-medium" rowSpan={2}>
              ตำแหน่ง
            </th>
            <th className="px-2 py-2 font-medium" colSpan={3}>
              วันลาพักผ่อนประจำปี
            </th>
            <th className="px-2 py-2 font-medium" colSpan={2}>
              ลา
            </th>
            <th className="px-2 py-2 font-medium" rowSpan={2}>
              เหลือ
            </th>
          </tr>
          <tr className="border-b bg-muted/30 text-center text-xs print:bg-transparent">
            <th className="px-2 py-1 font-medium">สะสม</th>
            <th className="px-2 py-1 font-medium">ปีนี้</th>
            <th className="px-2 py-1 font-medium">รวม</th>
            <th className="px-2 py-1 font-medium">ครั้ง</th>
            <th className="px-2 py-1 font-medium">วัน</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                className="px-3 py-8 text-center text-muted-foreground"
              >
                ไม่มีข้อมูล
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row.personId}
                className={cn(
                  index % 2 === 0 ? "bg-card" : "bg-muted/20",
                  "print:bg-white",
                )}
              >
                <td className="px-2 py-2 text-center">{index + 1}</td>
                <td className="px-2 py-2">{row.displayName}</td>
                <td className="px-2 py-2 text-muted-foreground">
                  {row.positionLabel}
                </td>
                <td className="px-2 py-2 text-center">{row.collectDay}</td>
                <td className="px-2 py-2 text-center">{row.thisYearDay}</td>
                <td className="px-2 py-2 text-center">{row.totalEntitled}</td>
                <td className="px-2 py-2 text-center">{row.leaveTimes}</td>
                <td className="px-2 py-2 text-center">{row.leaveDays}</td>
                <td className="px-2 py-2 text-center">{row.remaining}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
