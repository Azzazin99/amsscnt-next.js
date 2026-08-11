import { redirect } from "next/navigation";
import { BudgetReceiveKindForm } from "@/components/budget/budget-receive-kind-form";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canReceiveBudgetByKind } from "@/lib/budget/permissions";
import { getActiveBudgetYear } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetKindReceive } from "@/lib/budget/workflow-actions";

export default async function BudgetReceiveBudgetNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canReceiveBudgetByKind(user, perms, "budget")) {
    redirect("/modules/budget/receive/budget");
  }

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        เพิ่มรายการรับเงินงบประมาณ {activeYear.budgetYear}
      </h2>
      <BudgetReceiveKindForm
        action={createBudgetKindReceive.bind(null, "budget")}
        cancelHref="/modules/budget/receive/budget"
      />
    </section>
  );
}
