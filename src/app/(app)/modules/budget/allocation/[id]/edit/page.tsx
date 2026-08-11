import { notFound, redirect } from "next/navigation";
import { BudgetAllocationForm } from "@/components/budget/budget-allocation-form";
import { canManageBudgetAllocation } from "@/lib/budget/permissions";
import { getLegacyBudgetReceive, listBudgetCodeItems } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { updateBudgetAllocation } from "@/lib/budget/workflow-actions";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetAllocationEditPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetAllocation(user, perms)) redirect("/modules/budget/allocation");

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getLegacyBudgetReceive(id);
  if (!row) notFound();

  const [plans, projects, keyActivities, moneySources] = await Promise.all([
    listBudgetCodeItems("plans", row.budgetYear),
    listBudgetCodeItems("project-products", row.budgetYear),
    listBudgetCodeItems("key-activities", row.budgetYear),
    listBudgetCodeItems("money-sources", row.budgetYear),
  ]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">แก้ไขการจัดสรร #{id}</h2>
      <BudgetAllocationForm
        action={updateBudgetAllocation.bind(null, id)}
        plans={plans}
        projects={projects}
        keyActivities={keyActivities}
        moneySources={moneySources}
        cancelHref={`/modules/budget/allocation/${id}`}
        showFileUpload={false}
        defaultValues={{
          recDate: row.recDate ?? "",
          num: row.num,
          bookNumber: row.bookNumber,
          bookRef: row.bookRef,
          plan: row.plan,
          project: row.project,
          activity: row.activity,
          activity2: row.activity2,
          mSource: row.mSource,
          mPay: row.mPay,
          item: row.item,
          detail: row.detail,
          money: row.money,
        }}
      />
    </section>
  );
}
