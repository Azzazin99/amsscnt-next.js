import { notFound, redirect } from "next/navigation";
import { BudgetWithdrawForm } from "@/components/budget/budget-withdraw-form";
import { canWithdrawBudget } from "@/lib/budget/permissions";
import {
  getBudgetWithdraw,
  listPayTypeOptions,
  listPersonOptions,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { updateBudgetWithdraw } from "@/lib/budget/workflow-actions";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetWithdrawEditPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  if (!canWithdrawBudget(user, perms)) redirect("/modules/budget/withdraw");

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetWithdraw(id);
  if (!row) notFound();

  const [payTypes, people] = await Promise.all([
    listPayTypeOptions(),
    listPersonOptions(),
  ]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">แก้ไขรายการขอเบิก #{id}</h2>
      <BudgetWithdrawForm
        action={updateBudgetWithdraw.bind(null, id)}
        payTypes={payTypes}
        people={people}
        cancelHref={`/modules/budget/withdraw/${id}`}
        defaultValues={{
          recDate: row.recDate,
          document: row.document,
          item: row.item,
          pjActivity: row.pjActivity,
          money: row.money,
          payType: Number.parseInt(row.payType ?? "0", 10) || 0,
          pRequest: (row as any).pRequest ?? "",
          borrowStatus: row.borrowStatus ?? 0,
        }}
      />
    </section>
  );
}
