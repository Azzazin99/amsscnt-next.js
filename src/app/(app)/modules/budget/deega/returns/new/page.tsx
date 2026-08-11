import { redirect } from "next/navigation";
import { BudgetDeegaReturnForm } from "@/components/budget/budget-deega-return-form";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canManageBudgetDeega } from "@/lib/budget/permissions";
import {
  getActiveBudgetYear,
  listActivityOptions,
  listPayTypeOptions,
  listProjectOptions,
  listPlanOptions,
  listReceiveOptions,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

// Dummy action for now until real backend logic is implemented
async function createBudgetDeegaReturn(formData: FormData) {
  "use server";
  // The actual implementation would insert into budget_deega with negative amounts or budget_money_return
  // Since the exact legacy behavior is unclear, we mock it for the UI task.
  return { ok: true };
}

export default async function BudgetDeegaReturnNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetDeega(user, perms)) redirect("/modules/budget/deega/returns");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const [payTypes, plans, projects, activities, receives] = await Promise.all([
    listPayTypeOptions(),
    listPlanOptions(activeYear.budgetYear),
    listProjectOptions(activeYear.budgetYear),
    listActivityOptions(activeYear.budgetYear),
    listReceiveOptions(activeYear.budgetYear),
  ]);

  return (
    <BudgetDeegaReturnForm
      action={createBudgetDeegaReturn}
      budgetYear={activeYear.budgetYear}
      payTypes={payTypes}
      plans={plans}
      projects={projects}
      activities={activities}
      receives={receives}
      cancelHref="/modules/budget/deega/returns"
    />
  );
}
