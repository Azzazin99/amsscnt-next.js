import Link from "next/link";
import { FileText } from "lucide-react";
import { ListPagination } from "@/components/core/list-pagination";
import { buttonVariants } from "@/components/ui/button";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { formatMoney } from "@/lib/budget/constants";
import { canManageBudgetDeega } from "@/lib/budget/permissions";
import {
  getActiveBudgetYear,
  listBudgetDeegas,
  countBudgetDeegas,
  PAGE_SIZE,
  parseBudgetListParams,
  resolveBudgetListPage,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { deleteBudgetDeega } from "@/lib/budget/workflow-actions";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

export default async function BudgetDeegaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { user, perms } = await requireBudgetAccess();
  const canWrite = canManageBudgetDeega(user, perms);

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const { page: rawPage } = parseBudgetListParams(await searchParams);
  const total = await countBudgetDeegas(activeYear.budgetYear);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, rawPage), totalPages);
  const offset = (page - 1) * PAGE_SIZE;

  const rows = await listBudgetDeegas(activeYear.budgetYear, page);

  const colSpan = canWrite ? 10 : 9;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-primary">
          ทะเบียนขอเบิกเงินคงคลัง ปีงบประมาณ {activeYear.budgetYear}
        </h2>
      </div>

      {/* Top bar: add button + pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {canWrite ? (
          <Link href="/modules/budget/deega/new" className={cn(buttonVariants({ variant: "default" }), "min-h-9 text-sm")}>
            ลงทะเบียน
          </Link>
        ) : (
          <div />
        )}
        <ListPagination page={page} totalPages={totalPages} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-center font-medium">
              <th className="px-2 py-2.5 text-center">ที่</th>
              <th className="px-2 py-2.5 text-center">ว/ด/ป</th>
              <th className="px-2 py-2.5 text-center">เลขที่ฎีกา</th>
              <th className="px-2 py-2.5 text-center">เลขที่เอกสาร</th>
              <th className="px-2 py-2.5 text-center">ใบงวด</th>
              <th className="px-2 py-2.5 text-left">รายการ</th>
              <th className="px-2 py-2.5 text-right">ขอเบิก</th>
              <th className="px-2 py-2.5 text-right">ภาษี</th>
              <th className="px-2 py-2.5 text-right">รับจริง</th>
              {canWrite && <th className="px-2 py-2.5 text-center">จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-3 py-8 text-center text-muted-foreground">
                  ยังไม่มีข้อมูลฎีกา
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                async function handleDelete() {
                  "use server";
                  await deleteBudgetDeega(row.id);
                }
                const rowNum = offset + i + 1;
                const isAlt = i % 2 === 1;
                return (
                  <tr
                    key={row.id}
                    className={isAlt ? "bg-yellow-50 dark:bg-yellow-950/20" : "bg-card"}
                  >
                    <td className="px-2 py-2 text-center text-muted-foreground tabular-nums">
                      {rowNum}
                    </td>
                    <td className="px-2 py-2 text-center whitespace-nowrap tabular-nums">
                      {formatThaiDate(row.recDate)}
                    </td>
                    <td className="px-2 py-2 text-center tabular-nums">
                      {row.deegaNum ?? "—"}
                    </td>
                    <td className="px-2 py-2 text-center tabular-nums">
                      {row.doc || "—"}
                    </td>
                    <td className="px-2 py-2 text-center tabular-nums">
                      {row.receiveNum || "—"}
                    </td>
                    <td className="px-2 py-2 text-left">{row.item}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatMoney(row.withdraw)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatMoney(row.tax)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatMoney(row.pay)}
                    </td>
                    {canWrite && (
                      <td className="px-2 py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/modules/budget/deega/${row.id}/edit`}
                            title="แก้ไข"
                            className="text-primary hover:text-primary/70"
                          >
                            <FileText className="h-4 w-4" />
                          </Link>
                          <form action={handleDelete}>
                            <button
                              type="submit"
                              title="ลบ"
                              className="text-destructive hover:text-destructive/70 text-xs"
                            >
                              ลบ
                            </button>
                          </form>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom pagination */}
      <div className="flex justify-center">
        <ListPagination page={page} totalPages={totalPages} />
      </div>
    </section>
  );
}
