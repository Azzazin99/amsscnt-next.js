import { redirect } from "next/navigation";
import { BudgetCodeCategoryList } from "@/components/budget/budget-code-category-list";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canManageBudgetSettingsData } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetCodeItems } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

export default async function BudgetMoneySourcesPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetSettingsData(user, perms)) redirect("/modules/budget");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const rows = await listBudgetCodeItems("money-sources", activeYear.budgetYear);
  return (
    <BudgetCodeCategoryList
      category="money-sources"
      title={`แหล่งของเงิน ปีงบประมาณ ${activeYear.budgetYear}`}
      nameLabel="ชื่อแหล่งของเงิน"
      basePath="/modules/budget/money-sources"
      rows={rows}
    />
  );
}
