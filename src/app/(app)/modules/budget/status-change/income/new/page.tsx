import { redirect } from "next/navigation";
import { BudgetStatusChangeForm } from "@/components/budget/budget-status-change-form";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canChangeBudgetStatus } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetTypeOptions } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetStatusChange } from "@/lib/budget/workflow-actions";

export default async function BudgetStatusChangeIncomeNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canChangeBudgetStatus(user, perms, "income")) {
    redirect("/modules/budget/status-change/income");
  }

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const types = await listBudgetTypeOptions(activeYear.budgetYear, "income");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        เพิ่มรายการปรับปรุงเงินรายได้แผ่นดิน {activeYear.budgetYear}
      </h2>
      <BudgetStatusChangeForm
        action={createBudgetStatusChange.bind(null, "income")}
        cancelHref="/modules/budget/status-change/income"
        types={types}
      />
    </section>
  );
}
