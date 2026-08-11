import Link from "next/link";
import { PlanEmptyState } from "@/components/plan/plan-empty-state";
import { formatMoney } from "@/lib/budget/constants";
import {
  countBudgetReceiveRows,
  getActivePlanYear,
  listBudgetReceiveRows,
} from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

export default async function InstallmentRegisterPage() {
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

  const total = await countBudgetReceiveRows(activeYear.budgetYear);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        ทะเบียนเงินงวด ปีงบประมาณ {activeYear.budgetYear}
      </h2>

      {total === 0 ? (
        <PlanEmptyState
          title="ยังไม่มีทะเบียนเงินงวด"
          message="ยังไม่มีรายการรับเงินงบประมาณสำหรับปีนี้"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-3 font-medium">งวดที่</th>
                <th className="px-3 py-3 font-medium">เลขหนังสือ</th>
                <th className="px-3 py-3 font-medium">รายการ</th>
                <th className="px-3 py-3 text-right font-medium">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {(await listBudgetReceiveRows(activeYear.budgetYear)).map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5">{row.num}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.bookNumber || "—"}</td>
                  <td className="px-3 py-2.5">{row.item || row.activity2 || "—"}</td>
                  <td className="px-3 py-2.5 text-right">{formatMoney(row.money)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
