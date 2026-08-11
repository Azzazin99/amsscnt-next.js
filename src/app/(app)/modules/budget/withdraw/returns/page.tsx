import Link from "next/link";
import { AlertTriangle, Edit2, FileText, Trash2 } from "lucide-react";
import { ListPagination } from "@/components/core/list-pagination";
import { buttonVariants } from "@/components/ui/button";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { formatMoney } from "@/lib/budget/constants";
import { canWithdrawBudget } from "@/lib/budget/permissions";
import {
  countBudgetMoneyReturns,
  getActiveBudgetYear,
  listBudgetMoneyReturnsPage,
  PAGE_SIZE,
  sumBudgetMoneyReturns,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { deleteBudgetMoneyReturn } from "@/lib/budget/workflow-actions";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function BudgetWithdrawReturnsPage({ searchParams }: PageProps) {
  const { page: pageStr, q = "" } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageStr ?? "1", 10) || 1);

  const { user, perms } = await requireBudgetAccess();
  const canWrite = canWithdrawBudget(user, perms);

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const [total, totalSum, rows] = await Promise.all([
    countBudgetMoneyReturns(activeYear.budgetYear, q),
    sumBudgetMoneyReturns(activeYear.budgetYear, q),
    listBudgetMoneyReturnsPage(activeYear.budgetYear, page, q, PAGE_SIZE),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4">
      {/* Title Header (Centered) */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-teal-800 dark:text-teal-400">
          ทะเบียนคืนเงินโครงการ ปีงบประมาณ{activeYear.budgetYear}
        </h2>

        {/* Pagination Header (Centered) */}
        {totalPages > 1 && (
          <div className="pt-1 flex justify-center">
            <ListPagination page={page} totalPages={totalPages} />
          </div>
        )}
      </div>

      {/* Top Action Button */}
      <div className="flex items-center justify-between gap-3">
        {canWrite ? (
          <Link
            href="/modules/budget/withdraw/returns/new"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "bg-background hover:bg-muted font-medium text-xs h-9 px-3 border shadow-2xs",
            )}
          >
            ลงทะเบียน
          </Link>
        ) : <div />}
        <p className="text-xs text-muted-foreground font-medium">
          ทั้งหมด {total.toLocaleString("th-TH")} รายการ (หน้า {page} จาก {totalPages})
        </p>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[900px] text-sm border-collapse">
          <thead>
            <tr className="border-b bg-rose-200/70 dark:bg-rose-950/60 text-slate-800 dark:text-slate-100 text-left font-medium">
              <th className="px-3 py-2.5 font-medium text-center w-14 border-r border-border/50">ที่</th>
              <th className="px-3 py-2.5 font-medium text-left w-24 border-r border-border/50">วดป</th>
              <th className="px-3 py-2.5 font-medium text-left w-32 border-r border-border/50">ที่เอกสาร</th>
              <th className="px-3 py-2.5 font-medium text-left border-r border-border/50">รายการ</th>
              <th className="px-3 py-2.5 font-medium text-right w-36 border-r border-border/50">จำนวนเงิน</th>
              <th className="px-2 py-2.5 font-medium text-center w-20 border-r border-border/50">รายละเอียด</th>
              <th className="px-2 py-2.5 font-medium text-center w-12 border-r border-border/50">ลบ</th>
              <th className="px-2 py-2.5 font-medium text-center w-12 border-r border-border/50">แก้ไข</th>
              <th className="px-2 py-2.5 font-medium text-center w-14">รวม</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                  ยังไม่มีรายการคืนเงิน
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const rowIndex = (page - 1) * PAGE_SIZE + index + 1;
                const isOfficerMismatch = Boolean(
                  user?.personId && row.officer && row.officer !== user.personId,
                );

                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b last:border-0 hover:bg-muted/40 transition-colors",
                      index % 2 === 0 ? "bg-amber-50/30 dark:bg-amber-950/10" : "bg-card",
                    )}
                  >
                    <td className="px-3 py-2 text-center font-mono font-medium border-r border-border/30">
                      {rowIndex}
                    </td>
                    <td className="px-3 py-2 text-left whitespace-nowrap border-r border-border/30 text-xs font-medium">
                      {formatThaiDate(row.recDate)}
                    </td>
                    <td className="px-3 py-2 text-left border-r border-border/30 font-mono text-xs font-medium text-teal-700 dark:text-teal-400">
                      {row.document}
                    </td>
                    <td className="px-3 py-2 text-left border-r border-border/30 text-xs font-medium">
                      <span className="inline-flex items-center gap-1.5 flex-wrap">
                        {row.item}
                        {isOfficerMismatch && (
                          <span
                            title="เป็นรายการที่ดำเนินการโดยเจ้าหน้าที่คนอื่น"
                            className="inline-flex items-center text-amber-600 dark:text-amber-400"
                          >
                            <AlertTriangle className="size-3.5 fill-amber-500/20" />
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right border-r border-border/30 font-mono text-xs font-semibold">
                      {formatMoney(row.money)}
                    </td>
                    <td className="px-2 py-2 text-center border-r border-border/30">
                      <Link
                        href={`/modules/budget/withdraw/returns/${row.id}`}
                        className="inline-flex items-center justify-center p-1 rounded-sm text-slate-500 hover:text-primary hover:bg-muted"
                        title="รายละเอียด"
                      >
                        <FileText className="size-4" />
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-center border-r border-border/30">
                      {canWrite ? (
                        <form action={deleteBudgetMoneyReturn.bind(null, row.id)}>
                          <button
                            type="submit"
                            className="p-1 rounded-sm text-destructive hover:bg-destructive/10"
                            title="ลบ"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </form>
                      ) : (
                        <span className="text-muted-foreground/40">-</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center border-r border-border/30">
                      {canWrite ? (
                        <Link
                          href={`/modules/budget/withdraw/returns/${row.id}/edit`}
                          className="inline-flex items-center justify-center p-1 rounded-sm text-slate-500 hover:text-primary hover:bg-muted"
                          title="แก้ไข"
                        >
                          <Edit2 className="size-3.5" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground/40">-</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center text-xs">
                      <Link
                        href={`/modules/budget/withdraw/returns?page=${page}#row-${row.id}`}
                        className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
                      >
                        ถึงนี่
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Footer Total Row */}
          <tfoot>
            <tr className="border-t-2 bg-rose-200/60 dark:bg-rose-950/50 font-bold text-slate-900 dark:text-slate-100">
              <td colSpan={4} className="px-4 py-2.5 text-center border-r border-border/50">
                รวม
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-xs border-r border-border/50">
                {formatMoney(totalSum)}
              </td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="pt-2 flex justify-center">
          <ListPagination page={page} totalPages={totalPages} />
        </div>
      )}
    </section>
  );
}
