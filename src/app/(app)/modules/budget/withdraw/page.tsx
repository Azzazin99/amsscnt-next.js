import Link from "next/link";
import { AlertTriangle, FileText, Pencil, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ListPagination } from "@/components/core/list-pagination";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { formatMoney } from "@/lib/budget/constants";
import { canWithdrawBudget } from "@/lib/budget/permissions";
import {
  countBudgetWithdraws,
  getActiveBudgetYear,
  listBudgetWithdrawsPage,
  PAGE_SIZE,
  parseBudgetListParams,
  resolveBudgetListPage,
  sumBudgetWithdraws,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function BudgetWithdrawPage({ searchParams }: Props) {
  const { user, perms } = await requireBudgetAccess();
  const canWrite = canWithdrawBudget(user, perms);

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const sParams = await searchParams;
  const { page: rawPage, q } = parseBudgetListParams(sParams ?? {});

  const [total, totalSum] = await Promise.all([
    countBudgetWithdraws(activeYear.budgetYear, q),
    sumBudgetWithdraws(activeYear.budgetYear, q),
  ]);

  const page = await resolveBudgetListPage(total, rawPage);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rows = await listBudgetWithdrawsPage(activeYear.budgetYear, page, q);

  return (
    <section className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-teal-800 dark:text-teal-400">
          ทะเบียน คุมหลักฐานขอเบิก/ขอยืมเงิน ปีงบประมาณ {activeYear.budgetYear}
        </h2>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {canWrite ? (
            <Link
              href="/modules/budget/withdraw/new"
              className={cn(buttonVariants({ variant: "outline" }), "min-h-10 border-input shadow-xs font-semibold")}
            >
              ลงทะเบียน
            </Link>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          ทั้งหมด {total.toLocaleString("th-TH")} รายการ (หน้า {page} จาก {totalPages})
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[980px] text-sm border-collapse">
          <thead>
            <tr className="border-b bg-rose-100/60 dark:bg-rose-950/40 text-left font-medium text-slate-800 dark:text-slate-200">
              <th className="px-3 py-2.5 font-medium text-center w-14 border-r border-border/50">ที่</th>
              <th className="px-3 py-2.5 font-medium text-center w-24 border-r border-border/50">วดป</th>
              <th className="px-3 py-2.5 font-medium border-r border-border/50">ที่เอกสาร</th>
              <th className="px-3 py-2.5 font-medium border-r border-border/50 w-24 text-center">เลขอ้างอิง</th>
              <th className="px-3 py-2.5 font-medium border-r border-border/50">รายการ</th>
              <th className="px-3 py-2.5 text-right font-medium border-r border-border/50 w-36">จำนวนเงิน</th>
              <th className="px-2 py-2.5 text-center font-medium w-16 border-r border-border/50">สถานะ</th>
              <th className="px-2 py-2.5 text-center font-medium w-20 border-r border-border/50">ฎีกา</th>
              <th className="px-2 py-2.5 text-center font-medium w-16 border-r border-border/50">รายละเอียด</th>
              <th className="px-2 py-2.5 text-center font-medium w-12 border-r border-border/50">ลบ</th>
              <th className="px-2 py-2.5 text-center font-medium w-12 border-r border-border/50">แก้ไข</th>
              <th className="px-2 py-2.5 text-center font-medium w-14">รวม</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-8 text-center text-muted-foreground">
                  ยังไม่มีรายการ
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
                    <td className="px-3 py-2 text-center whitespace-nowrap border-r border-border/30 text-xs font-medium">
                      {formatThaiDate(row.recDate)}
                    </td>
                    <td className="px-3 py-2 border-r border-border/30 font-mono text-xs font-medium">
                      {row.document}
                    </td>
                    <td className="px-3 py-2 border-r border-border/30 text-center font-mono text-xs text-muted-foreground">
                      {row.id}
                    </td>
                    <td className="px-3 py-2 border-r border-border/30">
                      <div className="flex items-center gap-1.5">
                        <span className="font-normal">{row.item}</span>
                        {isOfficerMismatch ? (
                          <span title="เป็นรายการที่ดำเนินการโดยเจ้าหน้าที่คนอื่น" className="inline-flex">
                            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-500" />
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold border-r border-border/30">
                      {formatMoney(row.money)}
                    </td>
                    <td className="px-2 py-2 text-center border-r border-border/30">
                      <span
                        className={cn(
                          "inline-block size-3.5 rounded-xs shadow-xs",
                          row.borrowStatus === 1
                            ? "bg-rose-500 dark:bg-rose-600"
                            : "bg-emerald-500 dark:bg-emerald-600",
                        )}
                        title={row.borrowStatus === 1 ? "ขอยืมเงิน" : "ขอเบิก/ส่งใช้เงินยืม"}
                      />
                    </td>
                    <td className="px-2 py-2 text-center font-mono text-xs border-r border-border/30">
                      {row.deega ?? "—"}
                    </td>
                    <td className="px-2 py-2 text-center border-r border-border/30">
                      <Link
                        href={`/modules/budget/withdraw/${row.id}`}
                        className="p-1 inline-flex text-slate-500 hover:text-slate-700 hover:bg-muted rounded transition-colors"
                        title="รายละเอียด"
                      >
                        <FileText className="size-4" />
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-center border-r border-border/30">
                      {canWrite ? (
                        <button
                          type="button"
                          className="p-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                          title="ลบ"
                        >
                          <X className="size-4 stroke-[2.5]" />
                        </button>
                      ) : (
                        <span className="text-muted-foreground/30">-</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center border-r border-border/30">
                      {canWrite ? (
                        <Link
                          href={`/modules/budget/withdraw/${row.id}/edit`}
                          className="inline-flex p-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded transition-colors"
                          title="แก้ไข"
                        >
                          <Pencil className="size-4" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground/30">-</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Link
                        href={`/modules/budget/withdraw/${row.id}`}
                        className="text-xs text-sky-600 hover:underline font-medium"
                      >
                        ถึงนี่
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {rows.length > 0 ? (
            <tfoot>
              <tr className="border-t bg-rose-100/70 dark:bg-rose-950/50 font-bold">
                <td colSpan={5} className="px-4 py-2.5 text-center border-r border-border/50 font-bold">
                  รวม
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-base border-r border-border/50 text-slate-900 dark:text-slate-100">
                  {formatMoney(totalSum)}
                </td>
                <td colSpan={6} />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {/* หมายเหตุข้างล่าง */}
      <div className="rounded-lg border bg-card p-4 space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span className="inline-block size-3.5 rounded-xs bg-rose-500 shrink-0" />
          <span>สถานะขอยืมเงิน</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block size-3.5 rounded-xs bg-emerald-500 shrink-0" />
          <span>สถานะขอเบิก/ส่งใช้เงินยืม</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-500 shrink-0" />
          <span>เป็นรายการที่ดำเนินการโดยเจ้าหน้าที่คนอื่น</span>
        </div>
      </div>

      <ListPagination
        page={page}
        totalPages={totalPages}
        hrefForPage={(p) => `/modules/budget/withdraw?page=${p}${q ? `&q=${q}` : ""}`}
      />
    </section>
  );
}
