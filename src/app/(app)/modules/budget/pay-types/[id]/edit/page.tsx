import { notFound, redirect } from "next/navigation";
import { BudgetPayTypeForm } from "@/components/budget/budget-pay-type-form";
import { canManageBudgetSettingsData } from "@/lib/budget/permissions";
import { getBudgetPayType } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { updateBudgetPayType } from "@/lib/budget/settings-actions";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetPayTypeEditPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetSettingsData(user, perms)) redirect("/modules/budget");

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetPayType(id);
  if (!row) notFound();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">แก้ไขประเภทรายการจ่าย</h2>
      <BudgetPayTypeForm
        action={updateBudgetPayType.bind(null, id)}
        cancelHref="/modules/budget/pay-types"
        defaultValues={{
          payGroupId: row.payGroupId,
          payTypeId: row.payTypeId,
          payTypeName: row.payTypeName,
        }}
      />
    </section>
  );
}
