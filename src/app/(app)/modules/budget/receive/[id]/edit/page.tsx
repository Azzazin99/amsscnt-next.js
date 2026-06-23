import { notFound, redirect } from "next/navigation";
import { BudgetReceiveForm } from "@/components/budget/budget-receive-form";
import { updateBudgetReceive } from "@/lib/budget/actions";
import { canWriteBudgetReceive } from "@/lib/budget/permissions";
import { getBudgetMain } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetReceiveEditPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  if (!canWriteBudgetReceive(user, perms)) redirect("/modules/budget/receive");

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetMain(id);
  if (!row || row.receiveAmount == null) notFound();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">แก้ไขรายการรับ #{id}</h2>
      <BudgetReceiveForm
        action={updateBudgetReceive.bind(null, id)}
        cancelHref={`/modules/budget/receive/${id}`}
        defaultValues={{
          recDate: row.recDate,
          doc: row.doc,
          item: row.item,
          status: row.status ?? 1,
          receiveAmount: row.receiveAmount,
        }}
      />
    </section>
  );
}
