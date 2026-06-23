import { redirect } from "next/navigation";
import { BudgetDisburseForm } from "@/components/budget/budget-disburse-form";
import { createBudgetDisburse } from "@/lib/budget/actions";
import { canWriteBudgetDisburse } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listPayTypeOptions } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

export default async function BudgetDisburseNewPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canWriteBudgetDisburse(user, perms)) redirect("/modules/budget/disburse");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) redirect("/modules/budget/years");

  const payTypes = await listPayTypeOptions();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        เพิ่มรายการสั่งจ่าย {activeYear.budgetYear}
      </h2>
      {payTypes.length === 0 ? (
        <p className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          ยังไม่มีข้อมูลงบรายจ่าย (budget_pay_type) — นำเข้าจาก legacy หรือเพิ่มในฐานข้อมูลก่อนใช้ฟอร์มจ่าย
        </p>
      ) : null}
      <BudgetDisburseForm
        action={createBudgetDisburse}
        payTypes={payTypes}
        cancelHref="/modules/budget/disburse"
      />
    </section>
  );
}
