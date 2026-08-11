import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetReportSection } from "@/components/budget/budget-report-section";
import { getActiveBudgetYear } from "@/lib/budget/queries";
import { reportRemainingByInstallment } from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

export default async function BudgetReportRemainingByInstallmentPage() {
  await requireBudgetAccess();
  const year = await getActiveBudgetYear();
  if (!year) return <BudgetNoActiveYear />;

  const table = await reportRemainingByInstallment(year.budgetYear);
  return (
    <BudgetReportSection
      title={`รายงานเงินคงเหลือตามใบงวด ปีงบประมาณ ${year.budgetYear}`}
      table={table}
    />
  );
}
