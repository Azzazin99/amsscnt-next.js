import Link from "next/link";
import { PlanEmptyState } from "@/components/plan/plan-empty-state";
import { formatMoney } from "@/lib/budget/constants";
import { getActivePlanYear, listAllocationCheckRows } from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

export default async function SpendingCheckPage() {
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

  const rows = await listAllocationCheckRows(activeYear.budgetYear);

  const groups = new Map<
    number,
    { payGroupId: number; payTypeName: string | null; money: number; allocated: number }
  >();
  for (const row of rows) {
    const key = row.payGroupId ?? 0;
    const existing = groups.get(key);
    if (existing) {
      existing.money += row.money;
      existing.allocated += row.allocated;
    } else {
      groups.set(key, {
        payGroupId: key,
        payTypeName: row.payTypeName,
        money: row.money,
        allocated: row.allocated,
      });
    }
  }
  const grouped = [...groups.values()].sort((a, b) => a.payGroupId - b.payGroupId);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        ตรวจสอบการใช้จ่ายโครงการ {activeYear.budgetYear}
      </h2>

      {grouped.length === 0 ? (
        <PlanEmptyState
          title="ยังไม่มีข้อมูลงบประมาณ"
          message="ยังไม่มีรายการรับเงินงบประมาณสำหรับปีนี้"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-3 font-medium">กลุ่มเงิน</th>
                <th className="px-3 py-3 text-right font-medium">รับจัดสรร</th>
                <th className="px-3 py-3 text-right font-medium">ใช้จ่าย/จัดสรร</th>
                <th className="px-3 py-3 text-right font-medium">คงเหลือ</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((g, i) => {
                const remaining = g.money - g.allocated;
                return (
                  <tr
                    key={g.payGroupId}
                    className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
                  >
                    <td className="px-3 py-2.5">
                      {g.payTypeName ?? `กลุ่ม ${g.payGroupId}`}
                    </td>
                    <td className="px-3 py-2.5 text-right">{formatMoney(g.money)}</td>
                    <td className="px-3 py-2.5 text-right">{formatMoney(g.allocated)}</td>
                    <td
                      className={
                        remaining < 0
                          ? "px-3 py-2.5 text-right text-destructive"
                          : "px-3 py-2.5 text-right"
                      }
                    >
                      {formatMoney(remaining)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
