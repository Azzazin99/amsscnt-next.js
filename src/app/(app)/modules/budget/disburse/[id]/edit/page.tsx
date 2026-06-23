import { notFound, redirect } from "next/navigation";
import { BudgetDisburseForm } from "@/components/budget/budget-disburse-form";
import { updateBudgetDisburse } from "@/lib/budget/actions";
import { canWriteBudgetDisburse } from "@/lib/budget/permissions";
import { getBudgetMain, listPayTypeOptions } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetDisburseEditPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  if (!canWriteBudgetDisburse(user, perms)) redirect("/modules/budget/disburse");

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetMain(id);
  if (!row || row.payAmount == null) notFound();

  const payTypes = await listPayTypeOptions();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">แก้ไขรายการจ่าย #{id}</h2>
      <BudgetDisburseForm
        action={updateBudgetDisburse.bind(null, id)}
        payTypes={payTypes}
        cancelHref={`/modules/budget/disburse/${id}`}
        defaultValues={{
          recDate: row.recDate,
          doc: row.doc,
          item: row.item,
          payGroup: row.payGroup ?? payTypes[0]?.payTypeId ?? 0,
          payAmount: row.payAmount,
          payedPerson: row.payedPerson,
        }}
      />
    </section>
  );
}
