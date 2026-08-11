import { notFound, redirect } from "next/navigation";
import { BudgetPayKindForm } from "@/components/budget/budget-pay-kind-form";
import { canWriteBudgetPay } from "@/lib/budget/permissions";
import {
  getBudgetMain,
  listBudgetTypeOptions,
  listPayTypeOptions,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { updateBudgetKindPay } from "@/lib/budget/workflow-actions";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetPayIncomeEditPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  if (!canWriteBudgetPay(user, perms, "income")) redirect("/modules/budget/pay/income");

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetMain(id);
  if (!row || row.payAmount == null) notFound();

  const [payTypes, types] = await Promise.all([
    listPayTypeOptions(),
    listBudgetTypeOptions(row.budgetYear, "income"),
  ]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">แก้ไขรายการจ่าย #{id}</h2>
      <BudgetPayKindForm
        action={updateBudgetKindPay.bind(null, "income", id)}
        payTypes={payTypes}
        types={types}
        cancelHref={`/modules/budget/pay/income/${id}`}
        defaultValues={{
          recDate: row.recDate,
          doc: row.doc,
          item: row.item,
          typeId: row.typeId,
          payGroup: row.payGroup ?? 0,
          payAmount: row.payAmount,
          payedPerson: row.payedPerson,
        }}
      />
    </section>
  );
}
