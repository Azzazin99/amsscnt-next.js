import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetReportSection } from "@/components/budget/budget-report-section";
import { getActiveBudgetYear } from "@/lib/budget/queries";
import { reportMoneyBook } from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

export default async function BudgetReportIncomeBookPage() {
  await requireBudgetAccess();
  const year = await getActiveBudgetYear();
  if (!year) return <BudgetNoActiveYear />;

  const table = await reportMoneyBook(year.budgetYear, "income");
  return (
    <BudgetReportSection
      title={`ทะเบียนคุมเงินรายได้แผ่นดิน ${year.budgetYear}`}
      table={table}
    />
  );
}
