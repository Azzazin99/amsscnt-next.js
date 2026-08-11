import React from "react";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetYearFilter } from "@/components/budget/budget-year-filter";
import { formatMoney } from "@/lib/budget/constants";
import { getActiveBudgetYear, listBudgetYears } from "@/lib/budget/queries";
import { reportDailyBalanceList } from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = {
  searchParams: Promise<{
    year?: string;
    date?: string;
    month?: string;
    select_year?: string;
  }>;
};

const THAI_MONTHS: Record<number, string> = {
  1: "มกราคม",
  2: "กุมภาพันธ์",
  3: "มีนาคม",
  4: "เมษายน",
  5: "พฤษภาคม",
  6: "มิถุนายน",
  7: "กรกฎาคม",
  8: "สิงหาคม",
  9: "กันยายน",
  10: "ตุลาคม",
  11: "พฤศจิกายน",
  12: "ธันวาคม",
};

export default async function BudgetReportDailyBalancePage({
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

  const selectDate = params.date ? Number(params.date) : undefined;
  const selectMonth = params.month ? Number(params.month) : undefined;
  const selectBEYear = params.select_year
    ? Number(params.select_year)
    : undefined;

  const report = await reportDailyBalanceList({
    budgetYear: selectedYear,
    selectDate,
    selectMonth,
    selectYear: selectBEYear,
  });

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs overflow-hidden p-6 space-y-6">
      {/* Centered Document Header Title */}
      <div className="text-center space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
          รายงานเงินคงเหลือประจำวัน
        </h2>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          สำนักงานเขตพื้นที่การศึกษาประถมศึกษาชัยนาท
        </p>

        {/* Filter Toolbar: Date & Year Selection */}
        <form className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-2">
          {/* Left: Date Selection */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
            <span>วันที่</span>
            <select
              name="date"
              defaultValue={report.selectedDate}
              className="h-8 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <span>เดือน</span>
            <select
              name="month"
              defaultValue={report.selectedMonth}
              className="h-8 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {Object.entries(THAI_MONTHS).map(([mNum, mName]) => (
                <option key={mNum} value={mNum}>
                  {mName}
                </option>
              ))}
            </select>

            <span>ปี</span>
            <select
              name="select_year"
              defaultValue={report.selectedYear}
              className="h-8 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {[
                report.selectedYear - 1,
                report.selectedYear,
                report.selectedYear + 1,
              ].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-3.5 py-1 rounded-md bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs transition-colors shadow-2xs dark:bg-slate-700 dark:hover:bg-slate-600 ml-1"
            >
              ค้นหา
            </button>
          </div>

          {/* Right: Budget Year Selection */}
          <div className="flex items-center gap-2">
            <BudgetYearFilter years={yearList} selectedYear={selectedYear} />
          </div>
        </form>
      </div>

      {/* Main Table Minimal Slate Theme */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-xs sm:text-sm border-collapse border border-slate-200 dark:border-slate-800">
          <thead>
            {/* Row 1 Header */}
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold divide-x divide-slate-200 dark:divide-slate-700 border-b border-slate-200 dark:border-slate-700">
              <th rowSpan={2} className="px-4 py-2.5 text-left font-semibold">
                รายการ
              </th>
              <th
                colSpan={3}
                className="px-3 py-1.5 text-center bg-slate-200/90 dark:bg-slate-700/90 text-slate-900 dark:text-slate-100 font-semibold"
              >
                คงเหลือ
              </th>
              <th rowSpan={2} className="px-4 py-2.5 text-right w-44 font-semibold">
                รวม
              </th>
            </tr>
            {/* Row 2 Sub-Header */}
            <tr className="bg-slate-200/70 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 font-medium divide-x divide-slate-200 dark:divide-slate-700 border-b border-slate-200 dark:border-slate-700">
              <th className="px-3 py-2 text-right w-36 font-medium">เงินสด</th>
              <th className="px-3 py-2 text-right w-44 font-medium">เงินฝากธนาคาร</th>
              <th className="px-3 py-2 text-right w-44 font-medium">เงินฝากส่วนราชการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {report.sections.map((sec) => (
              <React.Fragment key={sec.categoryTitle}>
                {/* Category Header Row (Minimal Slate Tint) */}
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 font-bold divide-x divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
                  <td colSpan={5} className="px-4 py-2 text-left text-slate-800 dark:text-slate-200 font-bold">
                    {sec.categoryTitle}
                  </td>
                </tr>

                {/* Sub Rows inside category */}
                {sec.rows.map((row) => (
                  <tr
                    key={row.typeName}
                    className="bg-card hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors divide-x divide-slate-200 dark:divide-slate-800/60"
                  >
                    <td className="px-4 py-2 text-left pl-8 text-slate-700 dark:text-slate-300 font-normal">
                      {row.typeName}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatMoney(row.cash)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatMoney(row.bank)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatMoney(row.office)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                      {formatMoney(row.total)}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            {/* Grand Total Footer Row Minimal Slate Highlight */}
            <tr className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold divide-x divide-slate-200 dark:divide-slate-700">
              <td className="px-4 py-2.5 text-center font-bold">รวม</td>
              <td className="px-3 py-2.5 text-right font-mono font-bold">
                {formatMoney(report.totalCash)}
              </td>
              <td className="px-3 py-2.5 text-right font-mono font-bold">
                {formatMoney(report.totalBank)}
              </td>
              <td className="px-3 py-2.5 text-right font-mono font-bold">
                {formatMoney(report.totalOffice)}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-slate-950 dark:text-white font-bold">
                {formatMoney(report.grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
