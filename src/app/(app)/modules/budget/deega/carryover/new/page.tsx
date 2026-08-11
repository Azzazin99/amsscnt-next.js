import { redirect } from "next/navigation";
import { BudgetDeegaCarryoverForm } from "@/components/budget/budget-deega-carryover-form";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canManageBudgetDeega } from "@/lib/budget/permissions";
import {
  getActiveBudgetYear,
  listActivityOptions,
  listPayTypeOptions,
  listProjectOptions,
  listPlanOptions,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

async function createBudgetDeegaCarryover(formData: FormData) {
  "use server";
  return { ok: true };
}

export default async function BudgetDeegaCarryoverNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetDeega(user, perms)) redirect("/modules/budget/deega/carryover");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const [payTypes, plans, projects, activities] = await Promise.all([
    listPayTypeOptions(),
    listPlanOptions(activeYear.budgetYear),
    listProjectOptions(activeYear.budgetYear),
    listActivityOptions(activeYear.budgetYear),
  ]);

  return (
    <BudgetDeegaCarryoverForm
      action={createBudgetDeegaCarryover}
      budgetYear={activeYear.budgetYear}
      payTypes={payTypes}
      plans={plans}
      projects={projects}
      activities={activities}
      cancelHref="/modules/budget/deega/carryover"
    />
  );
}
