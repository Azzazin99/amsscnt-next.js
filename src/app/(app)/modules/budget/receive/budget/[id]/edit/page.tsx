import { notFound, redirect } from "next/navigation";
import { BudgetReceiveKindForm } from "@/components/budget/budget-receive-kind-form";
import { canReceiveBudgetByKind } from "@/lib/budget/permissions";
import { getBudgetReceive } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { updateBudgetKindReceive } from "@/lib/budget/workflow-actions";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetReceiveBudgetEditPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  if (!canReceiveBudgetByKind(user, perms, "budget")) {
    redirect("/modules/budget/receive/budget");
  }

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetReceive(id);
  if (!row) notFound();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">แก้ไขรายการรับ #{id}</h2>
      <BudgetReceiveKindForm
        action={updateBudgetKindReceive.bind(null, "budget", id)}
        cancelHref={`/modules/budget/receive/budget`}
        defaultValues={{
          recDate: row.recDate ?? "",
          doc: row.bookNumber ?? "",
          item: row.item,
          status: 1,
          receiveAmount: row.money,
        }}
      />
    </section>
  );
}
