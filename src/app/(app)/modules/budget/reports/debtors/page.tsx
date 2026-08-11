import React from "react";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetYearFilter } from "@/components/budget/budget-year-filter";
import { formatMoney } from "@/lib/budget/constants";
import { getActiveBudgetYear, listBudgetYears } from "@/lib/budget/queries";
import { reportDebtorsList } from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function BudgetReportDebtorsPage({ searchParams }: Props) {
  await requireBudgetAccess();

  const params = await searchParams;
  const activeYear = await getActiveBudgetYear();
  const allYears = await listBudgetYears();

  if (!activeYear && allYears.length === 0) return <BudgetNoActiveYear />;

  const yearList = allYears.map((y) => y.budgetYear);
  const selectedYear = params.year
    ? Number(params.year)
    : (activeYear?.budgetYear ?? yearList[0]);

  const report = await reportDebtorsList(selectedYear);

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden p-6 space-y-6">
      {/* Header Title Centered & Toolbar Right */}
      <div className="text-center space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-teal-800 dark:text-teal-400">
          รายงานลูกหนี้เงินยืม
        </h2>

        {/* Filter Toolbar Right matching screenshot */}
        <form className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <label className="text-xs sm:text-sm font-medium text-foreground">
            ปีงบประมาณ
          </label>
          <BudgetYearFilter years={yearList} selectedYear={selectedYear} />
        </form>
      </div>

      {/* Main Loan Debtors Table (7 columns matching screenshot 100%) */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-xs sm:text-sm border-collapse border border-border/60">
          <thead>
            <tr className="bg-rose-200/80 dark:bg-rose-950/60 text-foreground font-semibold divide-x divide-border/60 border-b border-border/60">
              <th className="px-2.5 py-2.5 text-center w-12">ที่</th>
              <th className="px-3 py-2.5 text-center w-24">วันยืม</th>
              <th className="px-3 py-2.5 text-left w-48">ผู้ยืม</th>
              <th className="px-3 py-2.5 text-left">รายการ</th>
              <th className="px-3 py-2.5 text-right w-36">จำนวนเงิน</th>
              <th className="px-3 py-2.5 text-center w-36">ประเภทเงิน</th>
              <th className="px-3 py-2.5 text-center w-24">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {report.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  ไม่พบข้อมูลลูกหนี้เงินยืมในปีงบประมาณ {selectedYear}
                </td>
              </tr>
            ) : (
              report.rows.map((row) => (
                <tr
                  key={row.id}
                  className="even:bg-amber-50/80 dark:even:bg-amber-950/20 odd:bg-card hover:bg-accent/40 transition-colors divide-x divide-border/30"
                >
                  <td className="px-2.5 py-2 text-center font-medium text-foreground">
                    {row.rowNum}
                  </td>
                  <td className="px-3 py-2 text-center font-medium text-foreground whitespace-nowrap">
                    {row.borrowDateShort}
                  </td>
                  <td className="px-3 py-2 text-left font-medium text-foreground">
                    {row.borrowerName}
                  </td>
                  <td className="px-3 py-2 text-left text-foreground">
                    {row.item}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-medium text-foreground">
                    {formatMoney(row.amount)}
                  </td>
                  <td className="px-3 py-2 text-center text-foreground font-medium">
                    {row.moneyType}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {row.isOverdue ? (
                      <span className="text-red-600 dark:text-red-400 font-bold">
                        {row.statusText}
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {row.statusText}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {report.rows.length > 0 ? (
            <tfoot>
              <tr className="border-t-2 border-border/80 bg-rose-200/80 dark:bg-rose-950/60 font-bold text-foreground divide-x divide-border/60">
                <td colSpan={4} className="px-3 py-2.5 text-center">
                  รวมทั้งสิ้น
                </td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">
                  {formatMoney(report.grandTotal)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </section>
  );
}
