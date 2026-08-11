import { redirect } from "next/navigation";
import { BudgetStatusChangeForm } from "@/components/budget/budget-status-change-form";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canChangeBudgetStatus } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetTypeOptions } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetStatusChange } from "@/lib/budget/workflow-actions";

export default async function BudgetStatusChangeExtraNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canChangeBudgetStatus(user, perms, "extra")) {
    redirect("/modules/budget/status-change/extra");
  }

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const types = await listBudgetTypeOptions(activeYear.budgetYear, "extra");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        เพิ่มรายการปรับปรุงเงินนอกงบประมาณ {activeYear.budgetYear}
      </h2>
      <BudgetStatusChangeForm
        action={createBudgetStatusChange.bind(null, "extra")}
        cancelHref="/modules/budget/status-change/extra"
        types={types}
      />
    </section>
  );
}
