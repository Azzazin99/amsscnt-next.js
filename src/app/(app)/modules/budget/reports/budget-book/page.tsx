import React from "react";
import Link from "next/link";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetYearFilter } from "@/components/budget/budget-year-filter";
import { AppPagination } from "@/components/ui/app-pagination";
import { formatMoney } from "@/lib/budget/constants";
import {
  PAGE_SIZE,
  getActiveBudgetYear,
  listBudgetYears,
} from "@/lib/budget/queries";
import { reportCashBookList } from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = {
  searchParams: Promise<{
    year?: string;
    page?: string;
    cal_id?: string;
  }>;
};

export default async function BudgetReportBudgetBookPage({
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

  const page = params.page ? Math.max(1, Number(params.page)) : 1;

  // Query cash book filtered strictly for budget money (type_id = 200)
  const report = await reportCashBookList({
    budgetYear: selectedYear,
    typeIndex: "2",
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(report.totalRows / PAGE_SIZE));

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden p-6 space-y-6">
      {/* 3-Line Centered Header Title & Top Pagination */}
      <div className="text-center space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-teal-800 dark:text-teal-400">
          รายงานเงินงบประมาณ
        </h2>
        <p className="text-sm font-semibold text-teal-700 dark:text-teal-500">
          สำนักงานเขตพื้นที่การศึกษาประถมศึกษาชัยนาท
        </p>

        {/* Standard System Pagination Top */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-2">
            <AppPagination currentPage={page} totalPages={totalPages} />
          </div>
        )}

        {/* Filter Toolbar Right */}
        <form className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <label className="text-xs sm:text-sm font-medium text-foreground">
            ปีงบประมาณ
          </label>
          <BudgetYearFilter years={yearList} selectedYear={selectedYear} />
        </form>
      </div>

      {/* Main Budget Money Table View (13 columns matching legacy bud_book.php) */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-xs sm:text-sm border-collapse border border-border/60">
          <thead>
            {/* Row 1 Header */}
            <tr className="bg-rose-200/80 dark:bg-rose-950/60 text-foreground font-semibold divide-x divide-border/60 border-b border-border/60">
              <th rowSpan={2} className="px-2 py-2 text-center w-10">
                ที่
              </th>
              <th rowSpan={2} className="px-2.5 py-2 text-center w-24">
                วันที่
              </th>
              <th rowSpan={2} className="px-3 py-2 text-left w-32">
                ที่เอกสาร
              </th>
              <th rowSpan={2} className="px-3 py-2 text-left">
                รายการ
              </th>
              <th rowSpan={2} className="px-3 py-2 text-left w-36">
                ลักษณะรายการ
              </th>
              <th rowSpan={2} className="px-3 py-2 text-right w-24">
                เปลี่ยน
              </th>
              <th rowSpan={2} className="px-3 py-2 text-right w-28">
                รับ
              </th>
              <th rowSpan={2} className="px-3 py-2 text-right w-28">
                จ่าย
              </th>
              <th
                colSpan={3}
                className="px-3 py-1 text-center bg-amber-500 dark:bg-amber-600 text-white font-semibold"
              >
                คงเหลือ
              </th>
              <th rowSpan={2} className="px-3 py-2 text-right w-32">
                รวม
              </th>
              <th rowSpan={2} className="px-2 py-2 text-center w-16">
                ถือเป็น
              </th>
            </tr>
            {/* Row 2 Sub-Header */}
            <tr className="bg-amber-500 dark:bg-amber-600 text-white font-semibold divide-x divide-white/30 border-b border-border/60">
              <th className="px-2.5 py-1.5 text-right w-28">เงินสด</th>
              <th className="px-2.5 py-1.5 text-right w-32">เงินฝากธนาคาร</th>
              <th className="px-2.5 py-1.5 text-right w-32">เงินฝากส่วนราชการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {report.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={13}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  ไม่พบข้อมูลรายการในรายงานเงินงบประมาณในปีงบประมาณ {selectedYear}
                </td>
              </tr>
            ) : (
              report.rows.map((row) => (
                <tr
                  key={row.id}
                  className="even:bg-amber-50/80 dark:even:bg-amber-950/20 odd:bg-card hover:bg-accent/40 transition-colors divide-x divide-border/30"
                >
                  <td className="px-2 py-1.5 text-center font-medium text-foreground">
                    {row.rowNum}
                  </td>
                  <td className="px-2.5 py-1.5 text-center font-medium text-foreground">
                    {row.dateShort}
                  </td>
                  <td className="px-3 py-1.5 text-left font-mono font-medium text-foreground">
                    {row.doc}
                  </td>
                  <td className="px-3 py-1.5 text-left text-foreground">
                    {row.item}
                  </td>
                  <td className="px-3 py-1.5 text-left text-foreground font-medium">
                    {row.statusLabel}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-foreground">
                    {row.changeAmount > 0 ? formatMoney(row.changeAmount) : ""}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-foreground">
                    {row.receiveAmount > 0
                      ? formatMoney(row.receiveAmount)
                      : ""}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-foreground">
                    {row.payAmount > 0 ? formatMoney(row.payAmount) : ""}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono text-foreground">
                    {formatMoney(row.cashBalance)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono text-foreground">
                    {formatMoney(row.bankBalance)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono text-foreground">
                    {formatMoney(row.officeBalance)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono font-medium text-foreground">
                    {formatMoney(row.totalBalance)}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <Link
                      href={`/modules/budget/reports/budget-book?cal_id=${row.id}&page=${page}`}
                      className="text-primary hover:underline text-xs font-semibold"
                    >
                      ถึงนี้
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {report.rows.length > 0 ? (
            <tfoot>
              <tr className="border-t-2 border-border/80 bg-rose-200/80 dark:bg-rose-950/60 font-bold text-foreground divide-x divide-border/60">
                <td colSpan={3} />
                <td colSpan={3} className="px-3 py-2 text-center">
                  รวม
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatMoney(report.totalReceive)}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatMoney(report.totalPay)}
                </td>
                <td className="px-2.5 py-2 text-right font-mono">
                  {formatMoney(report.finalCash)}
                </td>
                <td className="px-2.5 py-2 text-right font-mono">
                  {formatMoney(report.finalBank)}
                </td>
                <td className="px-2.5 py-2 text-right font-mono">
                  {formatMoney(report.finalOffice)}
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold">
                  {formatMoney(report.finalTotal)}
                </td>
                <td />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {/* Standard System Pagination Bottom */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <AppPagination currentPage={page} totalPages={totalPages} />
        </div>
      )}
    </section>
  );
}
