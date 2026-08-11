import React from "react";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetYearFilter } from "@/components/budget/budget-year-filter";
import { formatMoney } from "@/lib/budget/constants";
import { getActiveBudgetYear, listBudgetYears } from "@/lib/budget/queries";
import { reportSpendingByPayTypeList } from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function BudgetReportByPayTypePage({
  searchParams,
}: Props) {
  await requireBudgetAccess();

  const params = await searchParams;
  const activeYear = await getActiveBudgetYear();
  const allYears = await listBudgetYears();

  if (!activeYear && allYears.length === 0) return <BudgetNoActiveYear />;

  const yearList = allYears.map((y) => y.budgetYear);
  const selectedYear = params.year
    ? Number(params.year)
    : (activeYear?.budgetYear ?? yearList[0]);

  const report = await reportSpendingByPayTypeList(selectedYear);

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden p-6 space-y-6">
      {/* 3-Line Centered Header Title */}
      <div className="text-center space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-teal-800 dark:text-teal-400">
          รายงานการใช้จ่าย จำแนกตามประเภทรายการจ่าย
        </h2>
        <p className="text-sm font-semibold text-teal-700 dark:text-teal-500">
          สำนักงานเขตพื้นที่การศึกษาประถมศึกษาชัยนาท
        </p>
        <p className="text-xs sm:text-sm font-medium text-teal-700 dark:text-teal-500">
          {report.todayFormatted}
        </p>

        {/* Year Filter Toolbar Top Right */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <BudgetYearFilter years={yearList} selectedYear={selectedYear} />
        </div>
      </div>

      {/* Main Spending Table by Pay Type matching screenshot */}
      <div className="overflow-x-auto max-w-4xl mx-auto">
        <table className="w-full text-xs sm:text-sm border-collapse border border-border/60">
          <thead>
            <tr className="bg-rose-200/80 dark:bg-rose-950/60 text-foreground font-semibold divide-x divide-border/60 border-b border-border/60">
              <th className="px-3 py-2.5 text-center w-12">ที่</th>
              <th className="px-3 py-2.5 text-left w-20">รหัส</th>
              <th className="px-3 py-2.5 text-left">ประเภทรายการจ่าย</th>
              <th className="px-3 py-2.5 text-right w-44">จำนวนเงิน</th>
              <th className="px-3 py-2.5 text-right w-36">ร้อยละ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {report.items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  ไม่พบข้อมูลประเภทรายการจ่ายในปีงบประมาณ {selectedYear}
                </td>
              </tr>
            ) : (
              report.items.map((item) => (
                <tr
                  key={item.payTypeId}
                  className="even:bg-amber-50/80 dark:even:bg-amber-950/20 odd:bg-card hover:bg-accent/40 transition-colors divide-x divide-border/30"
                >
                  <td className="px-3 py-2 text-center font-medium text-foreground">
                    {item.id}
                  </td>
                  <td className="px-3 py-2 text-left font-mono font-medium text-foreground">
                    {item.payTypeId}
                  </td>
                  <td className="px-3 py-2 text-left text-foreground font-medium">
                    {item.payTypeName}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">
                    {formatMoney(item.money)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">
                    {item.money > 0 ? item.percent.toFixed(2) : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {report.items.length > 0 ? (
            <tfoot>
              <tr className="border-t-2 border-border/80 bg-rose-200/80 dark:bg-rose-950/60 font-bold text-foreground divide-x divide-border/60">
                <td colSpan={3} className="px-3 py-2.5 text-center">
                  รวม
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatMoney(report.totalMoney)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {report.totalMoney > 0 ? report.totalPercent.toFixed(2) : "0.00"}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>

        {/* Footnote bottom left */}
        <p className="text-xs text-muted-foreground pt-3 font-medium">
          *ไม่รวมเงินรายได้แผ่นดิน
        </p>
      </div>
    </section>
  );
}
