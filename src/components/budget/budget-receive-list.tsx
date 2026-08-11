import Link from "next/link";
import { FileText, Paperclip, Pencil, Printer, X } from "lucide-react";
import { ListPagination } from "@/components/core/list-pagination";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/budget/constants";
import { buildBudgetListUrl } from "@/lib/budget/list-url";
import type { BudgetReceiveRow } from "@/lib/budget/queries";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  basePath: string;
  rows: BudgetReceiveRow[];
  total: number;
  totalSum: number;
  page: number;
  totalPages: number;
  q: string;
  canWrite: boolean;
};

export function BudgetReceiveList({
  title,
  basePath,
  rows,
  total,
  totalSum,
  page,
  totalPages,
  q,
  canWrite,
}: Props) {
  return (
    <section className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-primary">{title}</h2>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {canWrite ? (
            <Link
              href={`${basePath}/new`}
              className={cn(buttonVariants({ variant: "outline" }), "min-h-10 border-input shadow-sm")}
            >
              เพิ่มรายการ
            </Link>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          ทั้งหมด {total.toLocaleString("th-TH")} รายการ
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[900px] text-sm border-collapse">
          <thead>
            <tr className="border-b bg-muted/60 text-left font-medium">
              <th className="px-3 py-3 font-medium text-center w-16 border-r border-border/50">ที่ใบงวด</th>
              <th className="px-3 py-3 font-medium border-r border-border/50 w-24">วดป</th>
              <th className="px-3 py-3 font-medium border-r border-border/50">รายการ</th>
              <th className="px-3 py-3 text-right font-medium border-r border-border/50 w-36">จำนวนเงิน</th>
              <th className="px-2 py-3 text-center font-medium w-16 border-r border-border/50">รายละเอียด</th>
              <th className="px-2 py-3 text-center font-medium w-14 border-r border-border/50">File</th>
              <th className="px-2 py-3 text-center font-medium w-12 border-r border-border/50">ลบ</th>
              <th className="px-2 py-3 text-center font-medium w-12 border-r border-border/50">แก้ไข</th>
              <th className="px-2 py-3 text-center font-medium w-14">พิมพ์</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                  ยังไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b last:border-0 hover:bg-muted/30 transition-colors",
                    i % 2 === 0 ? "bg-card" : "bg-muted/15",
                  )}
                >
                  <td className="px-3 py-2.5 text-center font-mono font-medium border-r border-border/30">
                    {row.num}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap border-r border-border/30 font-medium">
                    {row.recDate ? formatThaiDate(row.recDate) : row.outDate}
                  </td>
                  <td className="px-3 py-2.5 border-r border-border/30">
                    <span className="font-normal">{row.item}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold border-r border-border/30">
                    {formatMoney(row.money)}
                  </td>
                  <td className="px-2 py-2.5 text-center border-r border-border/30">
                    <Link
                      href={`${basePath}/${row.id}/detail`}
                      className="p-1 inline-flex text-slate-500 hover:text-slate-700 hover:bg-muted rounded transition-colors"
                      title={row.detail || "รายละเอียด"}
                    >
                      <FileText className="size-4" />
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 text-center border-r border-border/30">
                    {row.file ? (
                      <a
                        href={`/${row.file}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded transition-colors inline-block"
                        title="ดูไฟล์"
                      >
                        <Paperclip className="size-4" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground/40">-</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-center border-r border-border/30">
                    <button
                      type="button"
                      className="p-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                      title="ลบ"
                    >
                      <X className="size-4 stroke-[2.5]" />
                    </button>
                  </td>
                  <td className="px-2 py-2.5 text-center border-r border-border/30">
                    <Link
                      href={`${basePath}/${row.id}/edit`}
                      className="inline-flex p-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded transition-colors"
                      title="แก้ไข"
                    >
                      <Pencil className="size-4" />
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      className="p-1 text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded transition-colors"
                      title="พิมพ์"
                    >
                      <Printer className="size-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 ? (
            <tfoot>
              <tr className="border-t bg-muted/60 font-bold">
                <td colSpan={3} className="px-4 py-3 text-center border-r border-border/50">
                  รวม
                </td>
                <td className="px-3 py-3 text-right font-mono text-base border-r border-border/50">
                  {formatMoney(totalSum)}
                </td>
                <td colSpan={5} />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <ListPagination
        page={page}
        totalPages={totalPages}
        hrefForPage={(p) => buildBudgetListUrl(basePath, { page: p, q })}
      />
    </section>
  );
}
