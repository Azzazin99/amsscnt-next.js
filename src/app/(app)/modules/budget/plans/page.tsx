import { redirect } from "next/navigation";
import { BudgetCodeCategoryList } from "@/components/budget/budget-code-category-list";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canManageBudgetSettingsData } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetCodeItems } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

export default async function BudgetPlansPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetSettingsData(user, perms)) redirect("/modules/budget");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const rows = await listBudgetCodeItems("plans", activeYear.budgetYear);
  return (
    <BudgetCodeCategoryList
      category="plans"
      title={`แผนงาน ปีงบประมาณ ${activeYear.budgetYear}`}
      nameLabel="ชื่อแผนงาน"
      basePath="/modules/budget/plans"
      rows={rows}
    />
  );
}
