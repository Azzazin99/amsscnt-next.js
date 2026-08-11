import { notFound, redirect } from "next/navigation";
import { BudgetTypeForm } from "@/components/budget/budget-type-form";
import { canManageBudgetSettingsData } from "@/lib/budget/permissions";
import { getBudgetType } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { updateBudgetType } from "@/lib/budget/settings-actions";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetTypeEditPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetSettingsData(user, perms)) redirect("/modules/budget");

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetType(id);
  if (!row) notFound();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">แก้ไขประเภท(ย่อย)ของเงิน</h2>
      <BudgetTypeForm
        action={updateBudgetType.bind(null, id)}
        cancelHref="/modules/budget/types"
        defaultValues={{
          categoryId: row.categoryId,
          typeId: row.typeId,
          typeName: row.typeName,
        }}
      />
    </section>
  );
}
