import Link from "next/link";
import { redirect } from "next/navigation";
import { BudgetReceiveForm } from "@/components/budget/budget-receive-form";
import { createBudgetReceive } from "@/lib/budget/actions";
import { canWriteBudgetReceive } from "@/lib/budget/permissions";
import { getActiveBudgetYear } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

export default async function BudgetReceiveNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canWriteBudgetReceive(user, perms)) redirect("/modules/budget/receive");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) redirect("/modules/budget/years");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        เพิ่มรายการรับเงินงบประมาณ {activeYear.budgetYear}
      </h2>
      <BudgetReceiveForm
        action={createBudgetReceive}
        cancelHref="/modules/budget/receive"
      />
    </section>
  );
}
