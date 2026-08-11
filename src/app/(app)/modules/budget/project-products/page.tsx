import { redirect } from "next/navigation";
import { BudgetCodeCategoryList } from "@/components/budget/budget-code-category-list";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canManageBudgetSettingsData } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetCodeItems } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

export default async function BudgetProjectProductsPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetSettingsData(user, perms)) redirect("/modules/budget");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const rows = await listBudgetCodeItems("project-products", activeYear.budgetYear);
  return (
    <BudgetCodeCategoryList
      category="project-products"
      title={`ผลผลิตโครงการ ปีงบประมาณ ${activeYear.budgetYear}`}
      nameLabel="ชื่อผลผลิต/โครงการ"
      basePath="/modules/budget/project-products"
      rows={rows}
    />
  );
}
