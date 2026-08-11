import { redirect } from "next/navigation";
import { BudgetDeegaForm } from "@/components/budget/budget-deega-form";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canManageBudgetDeega } from "@/lib/budget/permissions";
import { getActiveBudgetYear } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetDeega } from "@/lib/budget/workflow-actions";

export default async function BudgetDeegaNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetDeega(user, perms)) redirect("/modules/budget/deega");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">เพิ่มฎีกา/เงินคงคลัง</h2>
      <BudgetDeegaForm action={createBudgetDeega} cancelHref="/modules/budget/deega" />
    </section>
  );
}
