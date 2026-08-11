import { redirect } from "next/navigation";
import { BudgetPayKindForm } from "@/components/budget/budget-pay-kind-form";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canWriteBudgetPay } from "@/lib/budget/permissions";
import {
  getActiveBudgetYear,
  listBudgetDeegaOptions,
  listBudgetTypeOptions,
  listBudgetWithdraws,
  listPayTypeOptions,
  listPersonOptions,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetKindPay } from "@/lib/budget/workflow-actions";

export default async function BudgetPayExtraNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canWriteBudgetPay(user, perms, "extra")) redirect("/modules/budget/pay/extra");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const [payTypes, types, people, withdraws, deegas] = await Promise.all([
    listPayTypeOptions(),
    listBudgetTypeOptions(activeYear.budgetYear, "extra"),
    listPersonOptions(),
    listBudgetWithdraws(activeYear.budgetYear),
    listBudgetDeegaOptions(activeYear.budgetYear),
  ]);

  const withdrawOptions = withdraws.map((w: any) => ({
    id: w.id,
    label: `${w.id} ${w.item}`,
  }));

  const deegaOptions = deegas.map((d: any) => ({
    id: d.id,
    label: `${d.deegaNum ?? d.id} ${d.item}`,
  }));

  return (
    <BudgetPayKindForm
      action={createBudgetKindPay.bind(null, "extra")}
      budgetYear={activeYear.budgetYear}
      payTypes={payTypes}
      types={types}
      people={people}
      withdrawOptions={withdrawOptions}
      deegaOptions={deegaOptions}
      cancelHref="/modules/budget/pay/extra"
    />
  );
}

