import Link from "next/link";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { formatMoney } from "@/lib/budget/constants";
import { canManageBudgetDeega } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetPos } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetPo, deleteBudgetPo } from "@/lib/budget/workflow-actions";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function BudgetDeegaCarryoverPage() {
  const { user, perms } = await requireBudgetAccess();
  const canWrite = canManageBudgetDeega(user, perms);

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const rows = await listBudgetPos(activeYear.budgetYear);

  async function handleCreate(formData: FormData) {
    "use server";
    await createBudgetPo(formData);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">
          ทะเบียนเงินกันเหลื่อมปี {activeYear.budgetYear}
        </h2>
        {canWrite ? (
          <Link
            href="/modules/budget/deega/carryover/new"
            className={cn(buttonVariants({ variant: "default" }), "min-h-9 text-sm")}
          >
            ลงทะเบียน
          </Link>
        ) : null}
      </div>



      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">วันที่</th>
              <th className="px-3 py-3 font-medium">เลขที่</th>
              <th className="px-3 py-3 font-medium">โครงการ</th>
              <th className="px-3 py-3 font-medium">รายการ</th>
              <th className="px-3 py-3 text-right font-medium">จำนวนเงิน</th>
              {canWrite ? (
                <th className="px-3 py-3 text-center font-medium">ลบ</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={canWrite ? 6 : 5} className="px-3 py-8 text-center text-muted-foreground">
                  ยังไม่มีรายการเงินกันเหลื่อมปี
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                async function handleDelete() {
                  "use server";
                  await deleteBudgetPo(row.id);
                }
                return (
                  <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {formatThaiDate(row.recDate)}
                    </td>
                    <td className="px-3 py-2.5">{row.doc}</td>
                    <td className="px-3 py-2.5">{row.project || "—"}</td>
                    <td className="px-3 py-2.5">{row.item || "—"}</td>
                    <td className="px-3 py-2.5 text-right">{formatMoney(row.pay)}</td>
                    {canWrite ? (
                      <td className="px-3 py-2.5 text-center">
                        <form action={handleDelete}>
                          <button type="submit" className="text-destructive hover:underline">
                            ลบ
                          </button>
                        </form>
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
