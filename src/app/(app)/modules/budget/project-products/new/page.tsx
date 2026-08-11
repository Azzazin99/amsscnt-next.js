import { redirect } from "next/navigation";
import { BudgetCodeForm } from "@/components/budget/budget-code-form";
import { canManageBudgetSettingsData } from "@/lib/budget/permissions";
import { createBudgetCodeItem } from "@/lib/budget/settings-actions";
import { requireBudgetAccess } from "@/lib/budget/scope";

export default async function BudgetProjectProductNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetSettingsData(user, perms)) redirect("/modules/budget");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">เพิ่มผลผลิต/โครงการ</h2>
      <BudgetCodeForm
        action={createBudgetCodeItem.bind(null, "project-products")}
        nameLabel="ชื่อผลผลิต/โครงการ"
        cancelHref="/modules/budget/project-products"
      />
    </section>
  );
}
