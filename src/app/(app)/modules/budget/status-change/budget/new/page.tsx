import { redirect } from "next/navigation";
import { BudgetStatusChangeForm } from "@/components/budget/budget-status-change-form";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canChangeBudgetStatus } from "@/lib/budget/permissions";
import { getActiveBudgetYear } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetStatusChange } from "@/lib/budget/workflow-actions";

export default async function BudgetStatusChangeBudgetNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canChangeBudgetStatus(user, perms, "budget")) {
    redirect("/modules/budget/status-change/budget");
  }

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        เพิ่มรายการปรับปรุงงบประมาณ {activeYear.budgetYear}
      </h2>
      <BudgetStatusChangeForm
        action={createBudgetStatusChange.bind(null, "budget")}
        cancelHref="/modules/budget/status-change/budget"
      />
    </section>
  );
}
