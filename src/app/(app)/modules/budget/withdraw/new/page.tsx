import { redirect } from "next/navigation";
import { BudgetWithdrawForm } from "@/components/budget/budget-withdraw-form";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canWithdrawBudget } from "@/lib/budget/permissions";
import {
  getActiveBudgetYear,
  listActivityOptions,
  listPayTypeOptions,
  listPersonOptions,
  listProjectOptions,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetWithdraw } from "@/lib/budget/workflow-actions";

export default async function BudgetWithdrawNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canWithdrawBudget(user, perms)) redirect("/modules/budget/withdraw");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const [payTypes, people, projects, activities] = await Promise.all([
    listPayTypeOptions(),
    listPersonOptions(),
    listProjectOptions(activeYear.budgetYear),
    listActivityOptions(activeYear.budgetYear),
  ]);

  return (
    <section className="space-y-4">
      <BudgetWithdrawForm
        action={createBudgetWithdraw}
        budgetYear={activeYear.budgetYear}
        payTypes={payTypes}
        people={people}
        projects={projects}
        activities={activities}
        cancelHref="/modules/budget/withdraw"
      />
    </section>
  );
}
