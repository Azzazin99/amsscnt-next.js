import { notFound, redirect } from "next/navigation";
import { BudgetDeegaForm } from "@/components/budget/budget-deega-form";
import { canManageBudgetDeega } from "@/lib/budget/permissions";
import { getBudgetDeega } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { updateBudgetDeega } from "@/lib/budget/workflow-actions";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetDeegaEditPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetDeega(user, perms)) redirect("/modules/budget/deega");

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetDeega(id);
  if (!row) notFound();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">แก้ไขฎีกา #{id}</h2>
      <BudgetDeegaForm
        action={updateBudgetDeega.bind(null, id)}
        cancelHref="/modules/budget/deega"
        defaultValues={{
          recDate: row.recDate ?? "",
          deegaNum: row.deegaNum ? Number.parseInt(row.deegaNum, 10) : null,
          doc: row.doc,
          receiveNum: row.receiveNum ?? "",
          plan: row.plan ?? "",
          project: row.project ?? "",
          activity: row.activity ?? "",
          payGroup: row.payGroup,
          item: row.item,
          withdraw: row.withdraw ?? 0,
          tax: row.tax ?? 0,
          pay: row.pay ?? 0,
          directPay: row.directPay ?? 0,
          directPayName: row.directPayName ?? "",
        }}
      />
    </section>
  );
}
