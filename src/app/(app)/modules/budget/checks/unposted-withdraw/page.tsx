import { redirect } from "next/navigation";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetReportSection } from "@/components/budget/budget-report-section";
import { canViewBudgetChecks } from "@/lib/budget/permissions";
import { getActiveBudgetYear } from "@/lib/budget/queries";
import { checkUnpostedWithdraw } from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

export default async function BudgetCheckUnpostedWithdrawPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canViewBudgetChecks(user, perms)) redirect("/modules/budget");

  const year = await getActiveBudgetYear();
  if (!year) return <BudgetNoActiveYear />;

  const table = await checkUnpostedWithdraw(year.budgetYear);
  return (
    <BudgetReportSection
      title={`ตรวจสอบการขอเบิกที่ยังไม่วางฎีกา ${year.budgetYear}`}
      table={table}
    />
  );
}
