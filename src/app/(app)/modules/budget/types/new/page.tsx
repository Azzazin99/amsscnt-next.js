import { redirect } from "next/navigation";
import { BudgetTypeForm } from "@/components/budget/budget-type-form";
import { canManageBudgetSettingsData } from "@/lib/budget/permissions";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetType } from "@/lib/budget/settings-actions";

export default async function BudgetTypeNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetSettingsData(user, perms)) redirect("/modules/budget");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">เพิ่มประเภท(ย่อย)ของเงิน</h2>
      <BudgetTypeForm action={createBudgetType} cancelHref="/modules/budget/types" />
    </section>
  );
}
