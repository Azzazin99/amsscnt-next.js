import Link from "next/link";
import { redirect } from "next/navigation";
import { BudgetCancelDeegaForm } from "@/components/budget/budget-cancel-deega-form";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canManageBudgetDeega } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetDeegaOptions } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetCancelDeega } from "@/lib/budget/workflow-actions";

export default async function BudgetDeegaCancelNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetDeega(user, perms)) redirect("/modules/budget/deega/cancel");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const deegaOptions = await listBudgetDeegaOptions(activeYear.budgetYear);

  return (
    <BudgetCancelDeegaForm
      action={createBudgetCancelDeega}
      budgetYear={activeYear.budgetYear}
      deegaOptions={deegaOptions.map((d) => ({
        id: d.id,
        label: `${d.deegaNum ?? d.id} ${d.item}`,
      }))}
      cancelHref="/modules/budget/deega/cancel"
    />
  );
}
