import { redirect } from "next/navigation";
import { BudgetCodeForm } from "@/components/budget/budget-code-form";
import { canManageBudgetSettingsData } from "@/lib/budget/permissions";
import { createBudgetCodeItem } from "@/lib/budget/settings-actions";
import { requireBudgetAccess } from "@/lib/budget/scope";

export default async function BudgetMoneySourceNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetSettingsData(user, perms)) redirect("/modules/budget");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">เพิ่มแหล่งของเงิน</h2>
      <BudgetCodeForm
        action={createBudgetCodeItem.bind(null, "money-sources")}
        nameLabel="ชื่อแหล่งของเงิน"
        cancelHref="/modules/budget/money-sources"
      />
    </section>
  );
}
