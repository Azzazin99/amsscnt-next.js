import { redirect } from "next/navigation";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetYearFilter } from "@/components/budget/budget-year-filter";
import { AppPagination } from "@/components/ui/app-pagination";
import { formatMoney } from "@/lib/budget/constants";
import { canViewBudgetChecks } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetYears } from "@/lib/budget/queries";
import { reportDeegaByWithdrawRef } from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = {
  searchParams: Promise<{ year?: string; page?: string }>;
};

export default async function BudgetCheckDeegaByWithdrawPage({
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

  const items = await reportDeegaByWithdrawRef(selectedYear);

  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pageItems = items.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden space-y-0">
      {/* Integrated Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b bg-muted/20">
        <div>
          <h2 className="text-base font-semibold text-teal-800 dark:text-teal-400 tracking-tight">
            ตรวจสอบฎีกากับการอ้างอิงการขอเบิกฯ จำแนกตามฎีกา ปีงบประมาณ{" "}
            {selectedYear}
          </h2>
        </div>
        <BudgetYearFilter years={yearList} selectedYear={selectedYear} />
      </div>

      {/* Top Pagination Bar */}
      <AppPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={items.length}
        pageSize={pageSize}
      />

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm border-collapse">
          <thead>
            <tr className="border-b bg-rose-200/70 dark:bg-rose-950/50 text-foreground font-semibold">
              <th className="px-4 py-3 text-center w-36">เลขที่ฎีกา</th>
              <th className="px-4 py-3 text-right">จำนวนเงินตามฎีกา</th>
              <th className="px-4 py-3 text-right">
                จำนวนเงินอ้างอิงไปยังการขอเบิกฯ
              </th>
              <th className="px-4 py-3 text-right w-44">ส่วนต่าง</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {pageItems.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  ไม่พบข้อมูลฎีกาในปีงบประมาณ {selectedYear}
                </td>
              </tr>
            ) : (
              pageItems.map((item) => (
                <tr
                  key={item.id}
                  className="even:bg-amber-50/70 dark:even:bg-amber-950/20 odd:bg-card hover:bg-accent/40 transition-colors"
                >
                  <td className="px-4 py-2.5 text-center text-foreground font-medium">
                    {item.deegaNum}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">
                    {formatMoney(item.withdrawDeega)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">
                    {formatMoney(item.withdrawMoney)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium text-foreground">
                    {formatMoney(item.diff)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination Bar */}
      <AppPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={items.length}
        pageSize={pageSize}
      />
    </section>
  );
}
