import { redirect } from "next/navigation";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetReportSection } from "@/components/budget/budget-report-section";
import { canViewBudgetChecks } from "@/lib/budget/permissions";
import { getActiveBudgetYear } from "@/lib/budget/queries";
import { checkUnpostedWithdraw } from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

export default async function BudgetCheckMissingDeegaPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canViewBudgetChecks(user, perms)) redirect("/modules/budget");

  const year = await getActiveBudgetYear();
  if (!year) return <BudgetNoActiveYear />;

  // การขอเบิกที่ยังไม่มีฎีกา = รายการที่ยังไม่ได้วางฎีกา
  const table = await checkUnpostedWithdraw(year.budgetYear);
  return (
    <BudgetReportSection
      title={`ตรวจสอบรายการที่ยังไม่มีฎีกา ${year.budgetYear}`}
      table={table}
      emptyMessage="ไม่มีรายการที่ขาดฎีกา"
    />
  );
}
