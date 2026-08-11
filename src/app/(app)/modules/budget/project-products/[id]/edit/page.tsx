import { notFound, redirect } from "next/navigation";
import { BudgetCodeForm } from "@/components/budget/budget-code-form";
import { canManageBudgetSettingsData } from "@/lib/budget/permissions";
import { getBudgetCodeItem } from "@/lib/budget/queries";
import { updateBudgetCodeItem } from "@/lib/budget/settings-actions";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetProjectProductEditPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetSettingsData(user, perms)) redirect("/modules/budget");

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetCodeItem("project-products", id);
  if (!row) notFound();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">แก้ไขผลผลิต/โครงการ</h2>
      <BudgetCodeForm
        action={updateBudgetCodeItem.bind(null, "project-products", id)}
        nameLabel="ชื่อผลผลิต/โครงการ"
        cancelHref="/modules/budget/project-products"
        defaultValues={{ code: row.code, name: row.name }}
      />
    </section>
  );
}
