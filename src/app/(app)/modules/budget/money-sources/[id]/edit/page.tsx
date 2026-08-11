import { notFound, redirect } from "next/navigation";
import { BudgetCodeForm } from "@/components/budget/budget-code-form";
import { canManageBudgetSettingsData } from "@/lib/budget/permissions";
import { getBudgetCodeItem } from "@/lib/budget/queries";
import { updateBudgetCodeItem } from "@/lib/budget/settings-actions";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetMoneySourceEditPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetSettingsData(user, perms)) redirect("/modules/budget");

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetCodeItem("money-sources", id);
  if (!row) notFound();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">แก้ไขแหล่งของเงิน</h2>
      <BudgetCodeForm
        action={updateBudgetCodeItem.bind(null, "money-sources", id)}
        nameLabel="ชื่อแหล่งของเงิน"
        cancelHref="/modules/budget/money-sources"
        defaultValues={{ code: row.code, name: row.name }}
      />
    </section>
  );
}
