import { redirect } from "next/navigation";
import { BudgetReceiveKindForm } from "@/components/budget/budget-receive-kind-form";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canReceiveBudgetByKind } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetTypeOptions } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetKindReceive } from "@/lib/budget/workflow-actions";

export default async function BudgetReceiveExtraNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canReceiveBudgetByKind(user, perms, "extra")) {
    redirect("/modules/budget/receive/extra");
  }

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const types = await listBudgetTypeOptions(activeYear.budgetYear, "extra");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        เพิ่มรายการรับเงินนอกงบประมาณ {activeYear.budgetYear}
      </h2>
      <BudgetReceiveKindForm
        action={createBudgetKindReceive.bind(null, "extra")}
        cancelHref="/modules/budget/receive/extra"
        types={types}
      />
    </section>
  );
}
