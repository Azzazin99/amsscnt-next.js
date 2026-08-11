import { notFound } from "next/navigation";
import { BudgetMainDetailView } from "@/components/budget/budget-main-detail";
import { canWriteBudgetPay } from "@/lib/budget/permissions";
import { getBudgetMain } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { deleteBudgetKindPay } from "@/lib/budget/workflow-actions";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetPayIncomeDetailPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetMain(id);
  if (!row || row.payAmount == null) notFound();

  async function handleDelete() {
    "use server";
    await deleteBudgetKindPay("income", id);
  }

  return (
    <BudgetMainDetailView
      row={row}
      mode="pay"
      basePath="/modules/budget/pay/income"
      backLabel="กลับทะเบียนจ่ายเงินรายได้แผ่นดิน"
      canWrite={canWriteBudgetPay(user, perms, "income")}
      deleteAction={handleDelete}
    />
  );
}
