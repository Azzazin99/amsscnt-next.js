"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ListPagination } from "@/components/core/list-pagination";
import {
  copyBudgetCodeFromPrevYear,
  deleteBudgetCodeItem,
} from "@/lib/budget/settings-actions";
import type { BudgetCodeCategory, BudgetCodeRow } from "@/lib/budget/queries";
import { cn } from "@/lib/utils";

type Props = {
  category: BudgetCodeCategory;
  title: string;
  nameLabel: string;
  basePath: string;
  rows: BudgetCodeRow[];
};

const ITEMS_PER_PAGE = 20;

export function BudgetCodeCategoryList({
  category,
  title,
  nameLabel,
  basePath,
  rows,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(rows.length / ITEMS_PER_PAGE) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const currentRows = rows.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <section className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-primary">รายการ {title}</h2>

        {totalPages > 1 && (
          <ListPagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`${basePath}/new`} className={cn(buttonVariants({ variant: "outline" }), "min-h-10 border-input shadow-sm")}>
          เพิ่มข้อมูล
        </Link>
        {rows.length === 0 ? (
          <form action={async () => { await copyBudgetCodeFromPrevYear(category); }}>
            <button
              type="submit"
              className={cn(buttonVariants({ variant: "outline" }), "min-h-10")}
            >
              คัดลอกจากปีเก่า
            </button>
          </form>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[600px] text-sm border-collapse">
          <thead>
            <tr className="border-b bg-muted/60 text-left font-medium">
              <th className="px-3 py-3 font-medium text-center w-12 border-r border-border/50">ที่</th>
              <th className="px-3 py-3 font-medium border-r border-border/50 w-24">รหัส</th>
              <th className="px-3 py-3 font-medium border-r border-border/50">{nameLabel}</th>
              <th className="px-3 py-3 text-center font-medium w-14 border-r border-border/50">ลบ</th>
              <th className="px-3 py-3 text-center font-medium w-14">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  ยังไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              currentRows.map((row, i) => {
                const rowIndex = startIndex + i + 1;
                return (
                  <tr key={row.id} className={cn("border-b last:border-0 hover:bg-muted/30 transition-colors", i % 2 === 0 ? "bg-card" : "bg-muted/15")}>
                    <td className="px-3 py-2.5 text-center font-medium border-r border-border/30">{rowIndex}</td>
                    <td className="px-3 py-2.5 font-mono border-r border-border/30 font-medium">{row.code}</td>
                    <td className="px-3 py-2.5 border-r border-border/30">{row.name}</td>
                    <td className="px-2 py-2.5 text-center border-r border-border/30">
                      <form action={async () => { await deleteBudgetCodeItem(category, row.id); }} className="inline-flex">
                        <button
                          type="submit"
                          className="p-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                          title="ลบ"
                        >
                          <X className="size-4 stroke-[2.5]" />
                        </button>
                      </form>
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <Link
                        href={`${basePath}/${row.id}/edit`}
                        className="inline-flex p-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded transition-colors"
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
        </table>
      </div>
    </section>
  );
}
