import Link from "next/link";
import { FileText, Pencil, X } from "lucide-react";
import { ListPagination } from "@/components/core/list-pagination";
import { BudgetListFilters } from "@/components/budget/budget-list-filters";
import { buttonVariants } from "@/components/ui/button";
import {
  changeStatusLabel,
  formatMoney,
  payGroupLabel,
  receiveStatusLabel,
} from "@/lib/budget/constants";
import { buildBudgetListUrl } from "@/lib/budget/list-url";
import type { BudgetMainRow } from "@/lib/budget/queries";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type Mode = "receive" | "pay" | "change";

type Props = {
  title: string;
  basePath: string;
  mode: Mode;
  rows: BudgetMainRow[];
  total: number;
  totalSum?: number;
  page: number;
  totalPages: number;
  q: string;
  canWrite: boolean;
  newLabel: string;
  showDetailLink?: boolean;
  deleteAction?: (id: number) => Promise<void>;
};

export function BudgetMainKindList({
  title,
  basePath,
  mode,
  rows,
  total,
  totalSum,
  page,
  totalPages,
  q,
  canWrite,
  newLabel,
  deleteAction,
}: Props) {
  const PAGE_SIZE = 25;

  return (
    <section className="space-y-4">
      {/* Title Header */}
      <div className="text-center py-2">
        <h2 className="text-xl font-bold text-teal-800 dark:text-teal-400">
          {title}
        </h2>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {canWrite ? (
            <Link
              href={`${basePath}/new`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-400 font-normal text-sm dark:bg-slate-800 dark:text-white dark:border-slate-600 shadow-xs"
              )}
            >
              {newLabel}
            </Link>
          ) : null}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          ทั้งหมด {total.toLocaleString("th-TH")} รายการ
        </p>
      </div>

      <BudgetListFilters q={q} basePath={basePath} />

      <div className="overflow-x-auto rounded-md border border-red-300 dark:border-red-900 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full min-w-[950px] text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-red-200 text-red-950 dark:bg-red-950/50 dark:text-red-100 border-b border-red-300 dark:border-red-900 text-center font-semibold">
              <th className="px-2 py-2.5 w-12 border-r border-red-300/60 dark:border-red-900">ที่</th>
              <th className="px-2 py-2.5 w-24 border-r border-red-300/60 dark:border-red-900">วดป</th>
              <th className="px-3 py-2.5 border-r border-red-300/60 dark:border-red-900 text-center">รายการ</th>
              <th className="px-3 py-2.5 text-right w-32 border-r border-red-300/60 dark:border-red-900">จำนวนเงิน</th>
              <th className="px-3 py-2.5 w-36 border-r border-red-300/60 dark:border-red-900 text-center">ประเภทเงิน</th>
              <th className="px-2 py-2.5 text-center w-20 border-r border-red-300/60 dark:border-red-900">รายละเอียด</th>
              <th className="px-2 py-2.5 text-center w-16 border-r border-red-300/60 dark:border-red-900">อนุมัติ</th>
              <th className="px-2 py-2.5 text-center w-16 border-r border-red-300/60 dark:border-red-900">จ่ายเงิน</th>
              <th className="px-2 py-2.5 text-center w-16">บันทึก</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                  ไม่พบรายการ
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const amount =
                  mode === "receive"
                    ? row.receiveAmount
                    : mode === "change"
                      ? row.changeAmount
                      : row.payAmount;

                // Status box colors:
                // Yellow = รอการอนุมัติ (approve is null / 0)
                // Green = อนุมัติให้จ่ายเงินได้ / จ่ายเงินแล้ว (approve === 1 / payDate != null)
                // Red = ไม่อนุมัติ / ยังไม่ได้จ่ายเงิน (approve === 2 / payDate is null)
                const isApproved = row.approve === 1;
                const isDisapproved = row.approve === 2;
                const isPaid = Boolean(row.payDate);

                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-slate-200/60 dark:border-slate-800 transition-colors",
                      i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-amber-50/50 dark:bg-slate-800/30"
                    )}
                  >
                    <td className="px-2 py-2 text-center font-mono border-r border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-center">
                      {formatThaiDate(row.recDate)}
                    </td>
                    <td className="px-3 py-2 border-r border-slate-200/60 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                      {row.item}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-medium border-r border-slate-200/60 dark:border-slate-800 text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatMoney(amount)}
                    </td>
                    <td className="px-3 py-2 text-center border-r border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      {mode === "pay"
                        ? (row.payGroupName ?? payGroupLabel(row.payGroup))
                        : mode === "change"
                          ? changeStatusLabel(row.status)
                          : receiveStatusLabel(row.status)}
                    </td>
                    <td className="px-2 py-2 text-center border-r border-slate-200/60 dark:border-slate-800">
                      <Link
                        href={`${basePath}/${row.id}`}
                        className="p-1 inline-flex text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 rounded transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <FileText className="size-4" />
                      </Link>
                    </td>
                    {/* อนุมัติ (Yellow = รออนุมัติ, Green = อนุมัติ, Red = ไม่อนุมัติ) */}
                    <td className="px-2 py-2 text-center border-r border-slate-200/60 dark:border-slate-800">
                      <div className="flex justify-center">
                        <span
                          className={cn(
                            "inline-block size-3.5 rounded-xs shadow-2xs",
                            isApproved
                              ? "bg-emerald-500"
                              : isDisapproved
                                ? "bg-red-600"
                                : "bg-yellow-300"
                          )}
                          title={isApproved ? "อนุมัติแล้ว" : isDisapproved ? "ไม่อนุมัติ" : "รอการอนุมัติ"}
                        />
                      </div>
                    </td>
                    {/* จ่ายเงิน (Green = จ่ายแล้ว, Red = ยังไม่ได้จ่ายเงิน) */}
                    <td className="px-2 py-2 text-center border-r border-slate-200/60 dark:border-slate-800">
                      <div className="flex justify-center">
                        <span
                          className={cn(
                            "inline-block size-3.5 rounded-xs shadow-2xs",
                            isPaid ? "bg-emerald-500" : "bg-red-600"
                          )}
                          title={isPaid ? "จ่ายเงินแล้ว" : "ยังไม่ได้จ่ายเงิน"}
                        />
                      </div>
                    </td>
                    {/* บันทึก (Edit link) */}
                    <td className="px-2 py-2 text-center">
                      <Link
                        href={`${basePath}/${row.id}/edit`}
                        className="p-1 inline-flex text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded transition-colors"
                        title="แก้ไข"
                      >
                        <Pencil className="size-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {rows.length > 0 && totalSum !== undefined ? (
            <tfoot>
              <tr className="border-t border-red-300 dark:border-red-900 bg-red-100/70 dark:bg-red-950/40 font-bold text-slate-900 dark:text-slate-100">
                <td colSpan={3} className="px-4 py-2.5 text-center border-r border-red-300/60 dark:border-red-900">
                  รวม
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-base border-r border-red-300/60 dark:border-red-900">
                  {formatMoney(totalSum)}
                </td>
                <td colSpan={5} />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {/* Status Color Legend at bottom */}
      <div className="pt-3 space-y-2 text-xs text-slate-700 dark:text-slate-300 pl-4 sm:pl-16">
        <div className="flex items-center gap-4">
          <span className="inline-block size-3.5 bg-yellow-300 rounded-xs shadow-2xs border border-yellow-400/50" />
          <span>รอการอนุมัติ</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-block size-3.5 bg-emerald-500 rounded-xs shadow-2xs" />
          <span>อนุมัติให้จ่ายเงินได้ / จ่ายเงินแล้ว</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-block size-3.5 bg-red-600 rounded-xs shadow-2xs" />
          <span>ไม่อนุมัติ / ยังไม่ได้จ่ายเงิน</span>
        </div>
      </div>

      <ListPagination
        page={page}
        totalPages={totalPages}
        hrefForPage={(p) => buildBudgetListUrl(basePath, { page: p, q })}
      />
    </section>
  );
}
