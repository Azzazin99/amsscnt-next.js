import React from "react";
import Link from "next/link";
import { FileSearch } from "lucide-react";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetYearFilter } from "@/components/budget/budget-year-filter";
import { AppPagination } from "@/components/ui/app-pagination";
import { formatMoney } from "@/lib/budget/constants";
import {
  PAGE_SIZE,
  getActiveBudgetYear,
  listBudgetYears,
} from "@/lib/budget/queries";
import { reportInstallmentRegisterList } from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = {
  searchParams: Promise<{
    year?: string;
    page?: string;
    cal_id?: string;
  }>;
};

export default async function BudgetCheckInstallmentReportPage({
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
  const calId = params.cal_id ? Number(params.cal_id) : undefined;

  const result = await reportInstallmentRegisterList({
    budgetYear: selectedYear,
    page,
    pageSize: PAGE_SIZE,
    calId,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const displayTotal = result.calSum ?? result.totalSum;

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden p-6 space-y-4">
      {/* Centered Header Title */}
      <div className="text-center space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-teal-800 dark:text-teal-400">
          ทะเบียนโอนการเปลี่ยนแปลงการจัดสรรงบประมาณ ปีงบประมาณ {selectedYear}
        </h2>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <BudgetYearFilter years={yearList} selectedYear={selectedYear} />
        </div>
      </div>

      {/* Top Standard Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-1">
          <AppPagination currentPage={page} totalPages={totalPages} />
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-xs sm:text-sm border-collapse border border-border/60">
          <thead>
            <tr className="bg-rose-200/80 dark:bg-rose-950/60 text-foreground font-semibold divide-x divide-border/60 border-b border-border/60">
              <th className="px-3 py-2.5 text-center w-20">ที่ใบงวด</th>
              <th className="px-3 py-2.5 text-left w-28">วดป</th>
              <th className="px-3 py-2.5 text-left">รายการ</th>
              <th className="px-3 py-2.5 text-right w-40">จำนวนเงิน</th>
              <th className="px-2 py-2.5 text-center w-24">รายละเอียด</th>
              <th className="px-3 py-2.5 text-center w-20">ผูกงบ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {result.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  ไม่พบข้อมูลทะเบียนเงินงวดในปีงบประมาณ {selectedYear}
                </td>
              </tr>
            ) : (
              result.rows.map((row) => {
                const isSelectedCal = calId === row.id;
                return (
                  <tr
                    key={row.id}
                    className="even:bg-amber-50/80 dark:even:bg-amber-950/20 odd:bg-card hover:bg-accent/40 transition-colors divide-x divide-border/30"
                  >
                    <td className="px-3 py-2 text-center font-mono font-medium text-foreground">
                      {row.num}
                    </td>
                    <td className="px-3 py-2 text-left font-medium text-foreground">
                      {row.dateShort}
                    </td>
                    <td className="px-3 py-2 text-left text-foreground">
                      {row.item}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-foreground font-medium">
                      {formatMoney(row.money)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Link
                        href={`/modules/budget/reports/installment-register?year=${selectedYear}&page=${page}&id=${row.id}`}
                        className="inline-flex items-center justify-center p-1 rounded hover:bg-muted text-primary"
                        title="ดูรายละเอียดใบงวด"
                      >
                        <FileSearch className="w-4 h-4 inline" />
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-center font-medium">
                      {isSelectedCal ? (
                        <Link
                          href={`/modules/budget/checks/installment-report?year=${selectedYear}&page=${page}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                          title="ยกเลิกสรุปถึงรายการนี้"
                        >
                          ถึงนี้&gt;&gt;
                        </Link>
                      ) : (
                        <Link
                          href={`/modules/budget/checks/installment-report?year=${selectedYear}&page=${page}&cal_id=${row.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                          title="สรุปยอดรวมถึงรายการนี้"
                        >
                          ถึงนี้
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {result.rows.length > 0 ? (
            <tfoot>
              <tr className="border-t-2 border-border/80 bg-rose-200/80 dark:bg-rose-950/60 font-bold text-foreground divide-x divide-border/60">
                <td colSpan={3} className="px-4 py-2.5 text-center">
                  รวม
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatMoney(displayTotal)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {/* Bottom Standard Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <AppPagination currentPage={page} totalPages={totalPages} />
        </div>
      )}
    </section>
  );
}
