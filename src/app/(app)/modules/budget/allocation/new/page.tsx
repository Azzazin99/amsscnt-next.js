import { redirect } from "next/navigation";
import { BudgetAllocationForm } from "@/components/budget/budget-allocation-form";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canManageBudgetAllocation } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetCodeItems } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetAllocation } from "@/lib/budget/workflow-actions";

export default async function BudgetAllocationNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetAllocation(user, perms)) redirect("/modules/budget/allocation");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const [plans, projects, keyActivities, moneySources] = await Promise.all([
    listBudgetCodeItems("plans", activeYear.budgetYear),
    listBudgetCodeItems("project-products", activeYear.budgetYear),
    listBudgetCodeItems("key-activities", activeYear.budgetYear),
    listBudgetCodeItems("money-sources", activeYear.budgetYear),
  ]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        เพิ่มการจัดสรรงบประมาณ {activeYear.budgetYear}
      </h2>
      <BudgetAllocationForm
        action={createBudgetAllocation}
        plans={plans}
        projects={projects}
        keyActivities={keyActivities}
        moneySources={moneySources}
        cancelHref="/modules/budget/allocation"
      />
    </section>
  );
}
