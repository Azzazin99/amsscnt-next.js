import { redirect } from "next/navigation";
import { BudgetPayTypeForm } from "@/components/budget/budget-pay-type-form";
import { canManageBudgetSettingsData } from "@/lib/budget/permissions";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetPayType } from "@/lib/budget/settings-actions";

export default async function BudgetPayTypeNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetSettingsData(user, perms)) redirect("/modules/budget");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">เพิ่มประเภทรายการจ่าย</h2>
      <BudgetPayTypeForm
        action={createBudgetPayType}
        cancelHref="/modules/budget/pay-types"
      />
    </section>
  );
}
