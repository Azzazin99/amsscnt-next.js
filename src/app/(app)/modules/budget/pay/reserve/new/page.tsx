import Link from "next/link";
import { redirect } from "next/navigation";
import { BudgetReserveForm } from "@/components/budget/budget-reserve-form";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canWriteBudgetPay } from "@/lib/budget/permissions";
import {
  getActiveBudgetYear,
  listBudgetWithdraws,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetReserveMoney } from "@/lib/budget/workflow-actions";

export default async function BudgetPayReserveNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canWriteBudgetPay(user, perms, "reserve")) redirect("/modules/budget/pay/reserve");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const withdraws = await listBudgetWithdraws(activeYear.budgetYear);
  const withdrawOptions = withdraws.map((w: any) => ({
    id: w.id,
    label: `${w.id} ${w.item}`,
  }));

  return (
    <BudgetReserveForm
      action={createBudgetReserveMoney}
      budgetYear={activeYear.budgetYear}
      withdrawOptions={withdrawOptions}
      cancelHref="/modules/budget/pay/reserve"
    />
  );
}
