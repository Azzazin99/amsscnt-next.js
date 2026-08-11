import { redirect } from "next/navigation";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetYearFilter } from "@/components/budget/budget-year-filter";
import { formatMoney } from "@/lib/budget/constants";
import { canViewBudgetChecks } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetYears } from "@/lib/budget/queries";
import { reportDeegaCutByInstallment } from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function BudgetCheckDeegaByInstallmentPage({
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

  const items = await reportDeegaCutByInstallment(selectedYear);

  // Total summary across all items
  const totalDeega = items.reduce((acc, r) => acc + r.withdrawDeega, 0);
  const totalProj = items.reduce((acc, r) => acc + r.withdrawProject, 0);
  const totalDiff = items.reduce((acc, r) => acc + r.diff, 0);

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden space-y-0">
      {/* Integrated Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b bg-muted/20">
        <div>
          <h2 className="text-base font-semibold text-teal-800 dark:text-teal-400 tracking-tight">
            ตรวจสอบการเบิกตามฎีกากับการตัดยอดโครงการ จำแนกตามใบงวด ปีงบประมาณ{" "}
            {selectedYear}
          </h2>
        </div>
        <BudgetYearFilter years={yearList} selectedYear={selectedYear} />
      </div>

      {/* Main Table (Full View without Pagination) */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm border-collapse">
          <thead>
            <tr className="border-b bg-rose-200/70 dark:bg-rose-950/50 text-foreground font-semibold">
              <th className="px-4 py-3 text-center w-28">เลขที่ใบงวด</th>
              <th className="px-4 py-3 text-right">จำนวนเงินเบิกตามฎีกา</th>
              <th className="px-4 py-3 text-right">จำนวนเงินตัดตามโครงการ</th>
              <th className="px-4 py-3 text-right w-44">ส่วนต่าง</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  ไม่พบข้อมูลใบงวดในปีงบประมาณ {selectedYear}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.num}
                  className="even:bg-amber-50/70 dark:even:bg-amber-950/20 odd:bg-card hover:bg-accent/40 transition-colors"
                >
                  <td className="px-4 py-2.5 text-center text-foreground font-medium">
                    {item.num}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">
                    {formatMoney(item.withdrawDeega)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">
                    {formatMoney(item.withdrawProject)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium text-foreground">
                    {formatMoney(item.diff)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {items.length > 0 ? (
            <tfoot>
              <tr className="border-t-2 border-border/80 bg-rose-200/70 dark:bg-rose-950/50 font-bold text-foreground">
                <td className="px-4 py-3 text-center">รวม</td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatMoney(totalDeega)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatMoney(totalProj)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatMoney(totalDiff)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {/* Note Footnote */}
      <div className="p-4 border-t bg-muted/10 text-xs sm:text-sm text-foreground/80 font-medium">
        <span className="font-bold text-foreground">หมายเหตุ</span>
        <span className="ml-2">ไม่ได้นำเงินคืนโครงการและเงินคืนคลังมาคำนวณ</span>
      </div>
    </section>
  );
}
