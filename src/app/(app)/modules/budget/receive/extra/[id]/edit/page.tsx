import { notFound, redirect } from "next/navigation";
import { BudgetReceiveKindForm } from "@/components/budget/budget-receive-kind-form";
import { canReceiveBudgetByKind } from "@/lib/budget/permissions";
import { getBudgetMain, listBudgetTypeOptions } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { updateBudgetKindReceive } from "@/lib/budget/workflow-actions";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetReceiveExtraEditPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  if (!canReceiveBudgetByKind(user, perms, "extra")) {
    redirect("/modules/budget/receive/extra");
  }

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetMain(id);
  if (!row || row.receiveAmount == null) notFound();

  const types = await listBudgetTypeOptions(row.budgetYear, "extra");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">แก้ไขรายการรับ #{id}</h2>
      <BudgetReceiveKindForm
        action={updateBudgetKindReceive.bind(null, "extra", id)}
        cancelHref={`/modules/budget/receive/extra/${id}`}
        types={types}
        defaultValues={{
          recDate: row.recDate,
          doc: row.doc,
          item: row.item,
          typeId: row.typeId,
          status: row.status ?? 1,
          receiveAmount: row.receiveAmount,
        }}
      />
    </section>
  );
}
