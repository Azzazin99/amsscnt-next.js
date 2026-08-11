import { notFound, redirect } from "next/navigation";
import { BudgetPayKindForm } from "@/components/budget/budget-pay-kind-form";
import { canWriteBudgetPay } from "@/lib/budget/permissions";
import { getBudgetMain, listPayTypeOptions } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { updateBudgetKindPay } from "@/lib/budget/workflow-actions";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetPayBudgetEditPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  if (!canWriteBudgetPay(user, perms, "budget")) redirect("/modules/budget/pay/budget");

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetMain(id);
  if (!row || row.payAmount == null) notFound();

  const payTypes = await listPayTypeOptions();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">แก้ไขรายการจ่าย #{id}</h2>
      <BudgetPayKindForm
        action={updateBudgetKindPay.bind(null, "budget", id)}
        payTypes={payTypes}
        cancelHref={`/modules/budget/pay/budget/${id}`}
        defaultValues={{
          recDate: row.recDate,
          doc: row.doc,
          item: row.item,
          payGroup: row.payGroup ?? 0,
          payAmount: row.payAmount,
          payedPerson: row.payedPerson,
        }}
      />
    </section>
  );
}
