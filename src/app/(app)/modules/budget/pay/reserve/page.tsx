import Link from "next/link";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/budget/constants";
import { canWriteBudgetPay } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetReserveMoney } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { deleteBudgetReserveMoney } from "@/lib/budget/workflow-actions";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

export default async function BudgetPayReservePage() {
  const { user, perms } = await requireBudgetAccess();
  const canWrite = canWriteBudgetPay(user, perms, "reserve");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const rows = await listBudgetReserveMoney(activeYear.budgetYear);

  const totalBorrow = rows.reduce((acc, r) => acc + (r.payAmount || 0), 0);
  const totalReturn = rows.reduce((acc, r) => acc + (r.receiveAmount || 0), 0);
  const totalOutstanding = totalBorrow - totalReturn;

  return (
    <section className="space-y-4">
      {/* Title Header (Centered) */}
      <div className="text-center py-2">
        <h2 className="text-xl font-bold text-teal-800 dark:text-teal-400">
          ทะเบียนเงินทดรองราชการ ปีงบประมาณ {activeYear.budgetYear}
        </h2>
      </div>

      {/* Button: จ่ายเงินทดรองข้าราชการ (Top Left) */}
      {canWrite ? (
        <div>
          <Link
            href="/modules/budget/pay/reserve/new"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-400 font-normal text-sm dark:bg-slate-800 dark:text-white dark:border-slate-600",
            )}
          >
            จ่ายเงินทดรองข้าราชการ
          </Link>
        </div>
      ) : null}

      {/* Data Table */}
      <div className="overflow-x-auto rounded-md border bg-card shadow-xs">
        <table className="w-full min-w-[900px] text-xs sm:text-sm">
          <thead>
            <tr className="bg-red-200 text-red-950 dark:bg-red-950/40 dark:text-red-200 border-b border-red-300 dark:border-red-900 text-center font-medium">
              <th className="px-2 py-2.5 w-12 font-semibold">ที่</th>
              <th className="px-2 py-2.5 w-24 font-semibold">วดป</th>
              <th className="px-2 py-2.5 w-28 font-semibold">ที่เอกสาร</th>
              <th className="px-2 py-2.5 w-28 font-semibold">ที่อ้างอิง</th>
              <th className="px-3 py-2.5 font-semibold text-center">รายการ</th>
              <th className="px-2 py-2.5 text-right font-semibold w-28">จำนวนเงินยืม</th>
              <th className="px-2 py-2.5 text-right font-semibold w-28">จำนวนเงินคืน</th>
              <th className="px-2 py-2.5 font-semibold w-16">รายละเอียด</th>
              {canWrite ? (
                <>
                  <th className="px-2 py-2.5 font-semibold w-12">ลบ</th>
                  <th className="px-2 py-2.5 font-semibold w-14">แก้ไข</th>
                  <th className="px-2 py-2.5 font-semibold w-20">พิมพ์ใบสั่งจ่าย</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="bg-red-100 text-red-950 dark:bg-red-950/20 dark:text-red-200 font-medium">
                <td colSpan={5} className="px-3 py-3 text-center font-semibold">
                  คงเหลือยังไม่คืน
                </td>
                <td className="px-3 py-3 text-right font-semibold font-mono">
                  {formatMoney(totalOutstanding)}
                </td>
                <td colSpan={canWrite ? 5 : 2} />
              </tr>
            ) : (
              <>
                {rows.map((row, i) => {
                  async function handleDelete() {
                    "use server";
                    await deleteBudgetReserveMoney(row.id);
                  }
                  return (
                    <tr
                      key={row.id}
                      className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
                    >
                      <td className="px-2 py-2 text-center">{i + 1}</td>
                      <td className="px-2 py-2 text-center whitespace-nowrap">
                        {formatThaiDate(row.recDate)}
                      </td>
                      <td className="px-2 py-2 text-center">{row.document}</td>
                      <td className="px-2 py-2 text-center">
                        {row.referWdId ? String(row.referWdId) : "—"}
                      </td>
                      <td className="px-3 py-2">{row.item}</td>
                      <td className="px-2 py-2 text-right font-mono">
                        {row.payAmount ? formatMoney(row.payAmount) : "—"}
                      </td>
                      <td className="px-2 py-2 text-right font-mono">
                        {row.receiveAmount ? formatMoney(row.receiveAmount) : "—"}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className="text-muted-foreground">—</span>
                      </td>
                      {canWrite ? (
                        <>
                          <td className="px-2 py-2 text-center">
                            <form action={handleDelete}>
                              <button
                                type="submit"
                                className="text-destructive hover:underline"
                              >
                                ลบ
                              </button>
                            </form>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <span className="text-muted-foreground">—</span>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <span className="text-muted-foreground">—</span>
                          </td>
                        </>
                      ) : null}
                    </tr>
                  );
                })}
                {/* Summary Row */}
                <tr className="bg-red-100 text-red-950 dark:bg-red-950/20 dark:text-red-200 font-medium border-t">
                  <td colSpan={5} className="px-3 py-3 text-center font-semibold">
                    คงเหลือยังไม่คืน
                  </td>
                  <td className="px-3 py-3 text-right font-semibold font-mono">
                    {formatMoney(totalOutstanding)}
                  </td>
                  <td colSpan={canWrite ? 5 : 2} />
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

