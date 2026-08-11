import React from "react";
import { redirect } from "next/navigation";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetYearFilter } from "@/components/budget/budget-year-filter";
import { formatMoney } from "@/lib/budget/constants";
import { canViewBudgetChecks } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetYears } from "@/lib/budget/queries";
import { reportCheckAllocationCheck2 } from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function BudgetCheckAllocationPage({
  searchParams,
}: Props) {
  const { user, perms } = await requireBudgetAccess();
  if (!canViewBudgetChecks(user, perms)) redirect("/modules/budget");

  const params = await searchParams;
  const activeYear = await getActiveBudgetYear();
  const allYears = await listBudgetYears();

  if (!activeYear && allYears.length === 0) return <BudgetNoActiveYear />;

  const yearList = allYears.map((y) => y.budgetYear);
  const selectedYear = params.year
    ? Number(params.year)
    : (activeYear?.budgetYear ?? yearList[0]);

  const report = await reportCheckAllocationCheck2(selectedYear);

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden p-6 space-y-8">
      {/* Centered Document Header Title */}
      <div className="text-center space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-teal-800 dark:text-teal-400">
          ตรวจสอบการจัดสรรงบประมาณ ปีงบประมาณ {selectedYear}
        </h2>

        {/* Filter Toolbar Right */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <BudgetYearFilter years={yearList} selectedYear={selectedYear} />
        </div>
      </div>

      {/* Table 1: Installment Allocations matching check_2.php */}
      <div className="overflow-x-auto max-w-5xl mx-auto">
        <table className="w-full text-xs sm:text-sm border-collapse border border-border/60">
          <thead>
            <tr className="bg-rose-200/80 dark:bg-rose-950/60 text-foreground font-semibold divide-x divide-border/60 border-b border-border/60">
              <th className="px-3 py-2.5 text-center w-24">ใบงวด</th>
              <th className="px-3 py-2.5 text-left">รายการ</th>
              <th className="px-3 py-2.5 text-right w-44">จำนวนเงินตามใบงวด</th>
              <th className="px-3 py-2.5 text-right w-44">
                จัดสรรกิจกรรมในโครงการ
              </th>
              <th className="px-3 py-2.5 text-right w-36">คงเหลือ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {report.installments.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  ไม่พบข้อมูลใบงวดในปีงบประมาณ {selectedYear}
                </td>
              </tr>
            ) : (
              report.installments.map((item) => (
                <tr
                  key={item.id}
                  className="even:bg-amber-50/80 dark:even:bg-amber-950/20 odd:bg-card hover:bg-accent/40 transition-colors divide-x divide-border/30"
                >
                  <td className="px-3 py-2 text-center font-mono font-medium text-foreground">
                    {item.num}
                  </td>
                  <td className="px-3 py-2 text-left text-foreground font-medium">
                    {item.item}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">
                    {formatMoney(item.receiveMoney)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">
                    {formatMoney(item.allocatedMoney)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-medium text-foreground">
                    {item.isComplete ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        ครบ
                      </span>
                    ) : (
                      formatMoney(item.remainingMoney)
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {report.installments.length > 0 ? (
            <tfoot>
              <tr className="border-t-2 border-border/80 bg-rose-200/80 dark:bg-rose-950/60 font-bold text-foreground divide-x divide-border/60">
                <td colSpan={2} className="px-3 py-2.5 text-center">
                  รวม
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatMoney(report.totalReceive)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatMoney(report.totalAllocated)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatMoney(report.totalRemaining)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {/* Table 2: Allocation Summary by 7 Budget Categories */}
      {report.categories.length > 0 ? (
        <div className="pt-4 max-w-4xl mx-auto space-y-2">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse border border-border/60">
              <thead>
                <tr className="bg-slate-200/90 dark:bg-slate-800 text-foreground font-semibold divide-x divide-border/60 border-b border-border/60">
                  <th className="px-3 py-2 text-center w-14">ที่</th>
                  <th className="px-3 py-2 text-left">ประเภท</th>
                  <th className="px-3 py-2 text-right w-44">จำนวนเงิน</th>
                  <th className="px-3 py-2 text-right w-44">จัดสรรแล้ว</th>
                  <th className="px-3 py-2 text-right w-40">คงเหลือ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {report.categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="bg-card hover:bg-accent/40 transition-colors divide-x divide-border/30"
                  >
                    <td className="px-3 py-1.5 text-center font-medium text-foreground">
                      {cat.id}
                    </td>
                    <td className="px-3 py-1.5 text-left text-foreground font-medium">
                      {cat.categoryName}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-foreground">
                      {formatMoney(cat.receivedMoney)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-foreground">
                      {formatMoney(cat.allocatedMoney)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono font-medium text-foreground">
                      {formatMoney(cat.remainingMoney)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border/80 bg-slate-200/90 dark:bg-slate-800 font-bold text-foreground divide-x divide-border/60">
                  <td colSpan={2} className="px-3 py-2 text-center">
                    รวม
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatMoney(report.totalCategoryReceive)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatMoney(report.totalCategoryAllocated)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatMoney(report.totalCategoryRemaining)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
