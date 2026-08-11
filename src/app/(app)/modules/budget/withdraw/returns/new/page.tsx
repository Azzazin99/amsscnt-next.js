import { redirect } from "next/navigation";
import { BudgetWithdrawForm } from "@/components/budget/budget-withdraw-form";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canWithdrawBudget } from "@/lib/budget/permissions";
import {
  getActiveBudgetYear,
  listPayTypeOptions,
  listPersonOptions,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetMoneyReturn } from "@/lib/budget/workflow-actions";

export default async function BudgetMoneyReturnNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canWithdrawBudget(user, perms)) redirect("/modules/budget/withdraw/returns");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const [payTypes, people] = await Promise.all([
    listPayTypeOptions(),
    listPersonOptions(),
  ]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">เพิ่มรายการคืนเงินโครงการ</h2>
      <BudgetWithdrawForm
        action={createBudgetMoneyReturn}
        payTypes={payTypes}
        people={people}
        cancelHref="/modules/budget/withdraw/returns"
      />
    </section>
  );
}
