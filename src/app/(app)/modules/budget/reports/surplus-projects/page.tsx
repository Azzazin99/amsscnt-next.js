import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetReportSection } from "@/components/budget/budget-report-section";
import { getActiveBudgetYear } from "@/lib/budget/queries";
import { reportSurplusProjects } from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

export default async function BudgetReportSurplusProjectsPage() {
  await requireBudgetAccess();
  const year = await getActiveBudgetYear();
  if (!year) return <BudgetNoActiveYear />;

  const table = await reportSurplusProjects(year.budgetYear);
  return (
    <BudgetReportSection
      title={`รายงานโครงการที่มีงบประมาณคงเหลือ ${year.budgetYear}`}
      table={table}
    />
  );
}
