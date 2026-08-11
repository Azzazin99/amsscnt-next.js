import { notFound } from "next/navigation";
import { BudgetMainDetailView } from "@/components/budget/budget-main-detail";
import { canReceiveBudgetByKind } from "@/lib/budget/permissions";
import { getBudgetMain } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { deleteBudgetKindReceive } from "@/lib/budget/workflow-actions";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetReceiveIncomeDetailPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetMain(id);
  if (!row || row.receiveAmount == null) notFound();

  async function handleDelete() {
    "use server";
    await deleteBudgetKindReceive("income", id);
  }

  return (
    <BudgetMainDetailView
      row={row}
      mode="receive"
      basePath="/modules/budget/receive/income"
      backLabel="กลับทะเบียนรับเงินรายได้แผ่นดิน"
      canWrite={canReceiveBudgetByKind(user, perms, "income")}
      deleteAction={handleDelete}
    />
  );
}
