import type { LeaveSickPrivacyBirthRow } from "@/lib/leave/reports/types";
import { cn } from "@/lib/utils";

type LeaveSickPrivacyBirthTableProps = {
  rows: LeaveSickPrivacyBirthRow[];
  showSchool?: boolean;
};

function StatCells({ stat }: { stat: { times: number; days: number } }) {
  return (
    <>
      <td className="px-2 py-2 text-center">{stat.times}</td>
      <td className="px-2 py-2 text-center">{stat.days}</td>
    </>
  );
}

export function LeaveSickPrivacyBirthTable({
  rows,
  showSchool = false,
}: LeaveSickPrivacyBirthTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm print:border-black print:shadow-none">
      <table className="w-full min-w-[800px] text-sm print:text-xs">
        <thead>
          <tr className="border-b bg-muted/50 text-center print:bg-transparent">
            <th className="px-2 py-2 font-medium" rowSpan={2}>
              ที่
            </th>
            {showSchool ? (
              <th className="px-2 py-2 font-medium" rowSpan={2}>
                โรงเรียน
              </th>
            ) : null}
            <th className="px-2 py-2 font-medium" rowSpan={2}>
              ชื่อ
            </th>
            <th className="px-2 py-2 font-medium" rowSpan={2}>
              ตำแหน่ง
            </th>
            <th className="px-2 py-2 font-medium" colSpan={2}>
              ลาป่วย
            </th>
            <th className="px-2 py-2 font-medium" colSpan={2}>
              ลากิจ
            </th>
            <th className="px-2 py-2 font-medium" colSpan={2}>
              ลาคลอด
            </th>
          </tr>
          <tr className="border-b bg-muted/30 text-center text-xs print:bg-transparent">
            <th className="px-2 py-1 font-medium">ครั้ง</th>
            <th className="px-2 py-1 font-medium">วัน</th>
            <th className="px-2 py-1 font-medium">ครั้ง</th>
            <th className="px-2 py-1 font-medium">วัน</th>
            <th className="px-2 py-1 font-medium">ครั้ง</th>
            <th className="px-2 py-1 font-medium">วัน</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={showSchool ? 11 : 10}
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
                {showSchool ? (
                  <td className="px-2 py-2">{row.schoolName ?? "—"}</td>
                ) : null}
                <td className="px-2 py-2">{row.displayName}</td>
                <td className="px-2 py-2 text-muted-foreground">
                  {row.positionLabel}
                </td>
                <StatCells stat={row.sick} />
                <StatCells stat={row.privacy} />
                <StatCells stat={row.birth} />
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
