import React from "react";
import { redirect } from "next/navigation";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetYearFilter } from "@/components/budget/budget-year-filter";
import { formatMoney } from "@/lib/budget/constants";
import { canViewBudgetChecks } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetYears } from "@/lib/budget/queries";
import { reportCheckSpendingByInstallmentCheck10 } from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function BudgetCheckSpendingByInstallmentPage({
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

  const report = await reportCheckSpendingByInstallmentCheck10(selectedYear);

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden p-6 space-y-8">
      {/* Centered Document Header Title */}
      <div className="text-center space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-teal-800 dark:text-teal-400">
          รายงานการใช้จ่ายในโครงการ(ปกติ) ปีงบประมาณ {selectedYear}
        </h2>

        {/* Filter Toolbar Right */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <BudgetYearFilter years={yearList} selectedYear={selectedYear} />
        </div>
      </div>

      {/* Table 1: Installment Project Spending matching check_10.php */}
      <div className="overflow-x-auto max-w-5xl mx-auto">
        <table className="w-full text-xs sm:text-sm border-collapse border border-border/60">
          <thead>
            <tr className="bg-rose-200/80 dark:bg-rose-950/60 text-foreground font-semibold divide-x divide-border/60 border-b border-border/60">
              <th className="px-3 py-2.5 text-center w-24">เลขที่ใบงวด</th>
              <th className="px-3 py-2.5 text-left">รายการ</th>
              <th className="px-3 py-2.5 text-right w-36">จำนวนเงิน</th>
              <th className="px-3 py-2.5 text-right w-36">ตัดจ่ายในโครงการ</th>
              <th className="px-3 py-2.5 text-right w-36">คืนเงินโครงการ</th>
              <th className="px-3 py-2.5 text-right w-36">คงเหลือ</th>
              <th className="px-2.5 py-2.5 text-right w-20">%จ่าย</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {report.installments.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  ไม่พบข้อมูลการใช้จ่ายใบงวดในปีงบประมาณ {selectedYear}
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
                    {formatMoney(item.money)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">
                    {formatMoney(item.withdrawMoney)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">
                    {formatMoney(item.returnMoney)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-medium text-foreground">
                    {formatMoney(item.netMoney)}
                  </td>
                  <td className="px-2.5 py-2 text-right font-mono text-foreground">
                    {item.money > 0 ? item.percentSpent.toFixed(2) : ""}
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
                  {formatMoney(report.totalMoney)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatMoney(report.totalWithdraw)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatMoney(report.totalReturn)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatMoney(report.totalNet)}
                </td>
                <td className="px-2.5 py-2.5 text-right font-mono">
                  {report.totalPercent.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {/* Table 2: Spending Summary by 7 Budget Categories */}
      {report.categories.length > 0 ? (
        <div className="pt-4 max-w-4xl mx-auto space-y-2">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse border border-border/60">
              <thead>
                <tr className="bg-slate-200/90 dark:bg-slate-800 text-foreground font-semibold divide-x divide-border/60 border-b border-border/60">
                  <th className="px-3 py-2 text-center w-14">ที่</th>
                  <th className="px-3 py-2 text-left">ประเภท</th>
                  <th className="px-3 py-2 text-right w-40">จำนวนเงิน</th>
                  <th className="px-3 py-2 text-right w-40">ใช้จ่าย</th>
                  <th className="px-3 py-2 text-right w-40">คงเหลือ</th>
                  <th className="px-3 py-2 text-right w-24">%จ่าย</th>
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
                      {formatMoney(cat.money)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-foreground">
                      {formatMoney(cat.spentMoney)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono font-medium text-foreground">
                      {formatMoney(cat.netMoney)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-foreground">
                      {cat.money > 0 ? cat.percentSpent.toFixed(2) : ""}
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
                    {formatMoney(report.totalCategoryMoney)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatMoney(report.totalCategorySpent)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatMoney(report.totalCategoryNet)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {report.totalCategoryPercent.toFixed(2)} %
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
