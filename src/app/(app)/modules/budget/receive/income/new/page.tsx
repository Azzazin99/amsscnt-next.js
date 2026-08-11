import { redirect } from "next/navigation";
import { BudgetReceiveKindForm } from "@/components/budget/budget-receive-kind-form";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canReceiveBudgetByKind } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetTypeOptions } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetKindReceive } from "@/lib/budget/workflow-actions";

export default async function BudgetReceiveIncomeNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canReceiveBudgetByKind(user, perms, "income")) {
    redirect("/modules/budget/receive/income");
  }

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const types = await listBudgetTypeOptions(activeYear.budgetYear, "income");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        เพิ่มรายการรับเงินรายได้แผ่นดิน {activeYear.budgetYear}
      </h2>
      <BudgetReceiveKindForm
        action={createBudgetKindReceive.bind(null, "income")}
        cancelHref="/modules/budget/receive/income"
        types={types}
      />
    </section>
  );
}
