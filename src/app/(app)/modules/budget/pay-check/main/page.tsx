import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { formatMoney } from "@/lib/budget/constants";
import { canPayCheckBudget } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetApproveMain } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { payCheckBudget } from "@/lib/budget/workflow-actions";
import { formatThaiDate } from "@/lib/format/thai-date";

const inputClass =
  "h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function BudgetPayCheckMainPage() {
  const { user, perms } = await requireBudgetAccess();
  const canWrite = canPayCheckBudget(user, perms);

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const rows = await listBudgetApproveMain(activeYear.budgetYear);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        จ่ายเช็ค/ตัดจ่าย {activeYear.budgetYear}
      </h2>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">วันที่</th>
              <th className="px-3 py-3 font-medium">รายการ</th>
              <th className="px-3 py-3 text-right font-medium">จำนวนเงิน</th>
              {canWrite ? (
                <th className="px-3 py-3 font-medium">เลขที่เช็ค / ผู้รับ</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={canWrite ? 4 : 3} className="px-3 py-8 text-center text-muted-foreground">
                  ไม่มีรายการ
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                async function handlePay(formData: FormData) {
                  "use server";
                  await payCheckBudget(row.id, formData);
                }
                return (
                  <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {formatThaiDate(row.recDate)}
                    </td>
                    <td className="px-3 py-2.5">{row.item}</td>
                    <td className="px-3 py-2.5 text-right">{formatMoney(row.payAmount)}</td>
                    {canWrite ? (
                      <td className="px-3 py-2.5">
                        <form action={handlePay} className="flex flex-wrap items-center gap-2">
                          <input
                            name="checkNumber"
                            placeholder="เลขที่เช็ค"
                            maxLength={30}
                            className={`${inputClass} w-32`}
                          />
                          <input
                            name="payee"
                            placeholder="ผู้รับเงิน"
                            maxLength={50}
                            className={`${inputClass} w-40`}
                          />
                          <button type="submit" className="text-primary hover:underline">
                            บันทึกจ่าย
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
