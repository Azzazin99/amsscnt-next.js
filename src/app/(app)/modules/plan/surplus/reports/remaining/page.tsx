import Link from "next/link";
import { PlanEmptyState } from "@/components/plan/plan-empty-state";
import { formatMoney } from "@/lib/budget/constants";
import { getActivePlanYear, listActivitiesForStop } from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

export default async function SurplusRemainingReportPage() {
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

  const all = await listActivitiesForStop(activeYear.budgetYear);
  const stopped = all.filter((a) => a.stop === 1);
  const total = stopped.reduce((sum, a) => sum + (a.budgetActi ?? 0), 0);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          เหลือจ่ายจากยุติกิจกรรม/โครงการ {activeYear.budgetYear}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          รวมเงินเหลือจ่าย {formatMoney(total)} บาท
        </p>
      </div>

      {stopped.length === 0 ? (
        <PlanEmptyState
          title="ยังไม่มีกิจกรรมที่ยุติ"
          message="เมื่อทำเครื่องหมายหยุดกิจกรรมแล้ว งบที่ยุติจะสรุปที่นี่"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-3 font-medium">รหัส</th>
                <th className="px-3 py-3 font-medium">กิจกรรม</th>
                <th className="px-3 py-3 font-medium">โครงการ</th>
                <th className="px-3 py-3 text-right font-medium">งบเหลือจ่าย</th>
              </tr>
            </thead>
            <tbody>
              {stopped.map((a, i) => (
                <tr key={a.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5 font-mono">{a.codeActi}</td>
                  <td className="px-3 py-2.5">{a.nameActi}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {a.projectName ?? a.codeProj}
                  </td>
                  <td className="px-3 py-2.5 text-right">{formatMoney(a.budgetActi)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/40 font-medium">
                <td className="px-3 py-2.5" colSpan={3}>
                  รวม
                </td>
                <td className="px-3 py-2.5 text-right">{formatMoney(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
