import { redirect } from "next/navigation";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetReportSection } from "@/components/budget/budget-report-section";
import { canViewBudgetChecks } from "@/lib/budget/permissions";
import { getActiveBudgetYear } from "@/lib/budget/queries";
import { reportInstallmentRegister } from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

export default async function BudgetCheckWrongInstallmentPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canViewBudgetChecks(user, perms)) redirect("/modules/budget");

  const year = await getActiveBudgetYear();
  if (!year) return <BudgetNoActiveYear />;

  const table = await reportInstallmentRegister(year.budgetYear);
  return (
    <BudgetReportSection
      title={`ตรวจสอบงวดเงินที่ผิดพลาด ${year.budgetYear}`}
      table={table}
      emptyMessage="ไม่พบรายการงวดเงินที่ผิดพลาด"
    />
  );
}
