import Link from "next/link";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/budget/constants";
import { canManageBudgetDeega } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetDeegas } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { returnBudgetDeega } from "@/lib/budget/workflow-actions";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

export default async function BudgetDeegaReturnsPage() {
  const { user, perms } = await requireBudgetAccess();
  const canWrite = canManageBudgetDeega(user, perms);

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const rows = await listBudgetDeegas(activeYear.budgetYear);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            ทะเบียนคืนเงินคงคลัง ปีงบประมาณ {activeYear.budgetYear}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            กด “คืนเงิน” เพื่อสร้างรายการจ่ายในทะเบียนหลักอ้างอิงฎีกา หรือลงทะเบียนรายการคืนเงินด้วยตนเอง
          </p>
        </div>
        {canWrite ? (
          <Link
            href="/modules/budget/deega/returns/new"
            className={cn(buttonVariants({ variant: "default" }), "min-h-9 text-sm")}
          >
            ลงทะเบียน
          </Link>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">วันที่</th>
              <th className="px-3 py-3 font-medium">เลขที่ฎีกา</th>
              <th className="px-3 py-3 font-medium">รายการ</th>
              <th className="px-3 py-3 text-right font-medium">ยอดจ่าย</th>
              <th className="px-3 py-3 text-center font-medium">สถานะ</th>
              {canWrite ? (
                <th className="px-3 py-3 text-center font-medium">คืนเงิน</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={canWrite ? 6 : 5} className="px-3 py-8 text-center text-muted-foreground">
                  ยังไม่มีฎีกา
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                async function handleReturn() {
                  "use server";
                  await returnBudgetDeega(row.id);
                }
                return (
                  <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {formatThaiDate(row.recDate)}
                    </td>
                    <td className="px-3 py-2.5">{row.doc}</td>
                    <td className="px-3 py-2.5">{row.item}</td>
                    <td className="px-3 py-2.5 text-right">{formatMoney(row.pay)}</td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground">
                      {row.status === 1 ? "คืนแล้ว" : "รอคืน"}
                    </td>
                    {canWrite ? (
                      <td className="px-3 py-2.5 text-center">
                        {row.status === 1 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <form action={handleReturn}>
                            <button type="submit" className="text-primary hover:underline">
                              คืนเงิน
                            </button>
                          </form>
                        )}
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
