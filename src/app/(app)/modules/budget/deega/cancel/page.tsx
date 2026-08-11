import Link from "next/link";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canManageBudgetDeega } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetCancelDeegas } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import {
  createBudgetCancelDeega,
  deleteBudgetCancelDeega,
} from "@/lib/budget/workflow-actions";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function BudgetDeegaCancelPage() {
  const { user, perms } = await requireBudgetAccess();
  const canWrite = canManageBudgetDeega(user, perms);

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const rows = await listBudgetCancelDeegas(activeYear.budgetYear);

  async function handleCreate(formData: FormData) {
    "use server";
    await createBudgetCancelDeega(formData);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">
          ยกเลิกฎีกา {activeYear.budgetYear}
        </h2>
        {canWrite ? (
          <Link
            href="/modules/budget/deega/cancel/new"
            className={cn(buttonVariants({ variant: "default" }), "min-h-9 text-sm")}
          >
            บันทึกข้อมูล
          </Link>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">วันที่</th>
              <th className="px-3 py-3 font-medium">เลขที่ฎีกา</th>
              <th className="px-3 py-3 font-medium">อ้างอิง</th>
              <th className="px-3 py-3 font-medium">หมายเหตุ</th>
              {canWrite ? (
                <th className="px-3 py-3 text-center font-medium">ลบ</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={canWrite ? 5 : 4} className="px-3 py-8 text-center text-muted-foreground">
                  ยังไม่มีรายการยกเลิกฎีกา
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                async function handleDelete() {
                  "use server";
                  await deleteBudgetCancelDeega(row.id);
                }
                return (
                  <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {formatThaiDate(row.recDate)}
                    </td>
                    <td className="px-3 py-2.5">{row.deega}</td>
                    <td className="px-3 py-2.5">{row.ref || "—"}</td>
                    <td className="px-3 py-2.5">{row.comment || "—"}</td>
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
