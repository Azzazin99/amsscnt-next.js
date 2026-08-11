import Link from "next/link";
import { PlanEmptyState } from "@/components/plan/plan-empty-state";
import { formatMoney } from "@/lib/budget/constants";
import {
  getActivePlanYear,
  listActivityFundingForYear,
  listAllocationCheckRows,
} from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

export default async function SurplusAllocationReportPage() {
  await requirePlanAccess();
  const activeYear = await getActivePlanYear();

  if (!activeYear) {
    return (
      <section className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>ยังไม่ได้กำหนดปีงบประมาณ — ไปที่เมนูปีงบประมาณเพื่อตั้งค่าก่อน</p>
        <Link href="/modules/plan/years" className="mt-4 inline-block text-primary hover:underline">
          กำหนดปีงบประมาณ
        </Link>
      </section>
    );
  }

  const [rows, funding] = await Promise.all([
    listAllocationCheckRows(activeYear.budgetYear),
    listActivityFundingForYear(activeYear.budgetYear),
  ]);

  const fundingByApprove = new Map<string, number>();
  for (const f of funding) {
    fundingByApprove.set(
      f.codeApprove,
      (fundingByApprove.get(f.codeApprove) ?? 0) + (f.budgetActi ?? 0),
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        รายงานการจัดสรรเงิน (เงินเหลือจ่าย) {activeYear.budgetYear}
      </h2>

      {rows.length === 0 ? (
        <PlanEmptyState
          title="ยังไม่มีข้อมูลงบประมาณ"
          message="ยังไม่มีรายการรับเงินงบประมาณสำหรับปีนี้"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-3 font-medium">งวดที่</th>
                <th className="px-3 py-3 font-medium">ประเภทเงิน</th>
                <th className="px-3 py-3 text-right font-medium">รับจัดสรร</th>
                <th className="px-3 py-3 text-right font-medium">จัดสรรแล้ว</th>
                <th className="px-3 py-3 text-right font-medium">คงเหลือ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={`${row.num}-${i}`} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5">{row.num}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.payTypeName ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right">{formatMoney(row.money)}</td>
                  <td className="px-3 py-2.5 text-right">{formatMoney(row.allocated)}</td>
                  <td className="px-3 py-2.5 text-right">
                    {formatMoney(row.money - row.allocated)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        รายการแหล่งเงินเหลือจ่าย {fundingByApprove.size.toLocaleString("th-TH")} รหัสอนุมัติ
      </p>
    </section>
  );
}
