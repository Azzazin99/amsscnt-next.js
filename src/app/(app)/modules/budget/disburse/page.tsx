import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { BudgetListFilters } from "@/components/budget/budget-list-filters";
import { formatMoney } from "@/lib/budget/constants";
import { buildBudgetDisburseUrl } from "@/lib/budget/list-url";
import {
  PAGE_SIZE,
  countBudgetMain,
  getActiveBudgetYear,
  listBudgetMainPage,
  parseBudgetListParams,
  resolveBudgetListPage,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { formatThaiDate } from "@/lib/format/thai-date";

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function BudgetDisbursePage({ searchParams }: Props) {
  await requireBudgetAccess();
  const activeYear = await getActiveBudgetYear();
  const params = await searchParams;
  const parsed = parseBudgetListParams(params);

  if (!activeYear) {
    return (
      <section className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>ยังไม่ได้กำหนดปีงบประมาณ</p>
        <Link href="/modules/budget/years" className="mt-4 inline-block text-primary hover:underline">
          กำหนดปีงบประมาณ
        </Link>
      </section>
    );
  }

  const total = await countBudgetMain(activeYear.budgetYear, parsed.q, "disburse");
  const page = await resolveBudgetListPage(total, parsed.page);
  const rows = await listBudgetMainPage({
    budgetYear: activeYear.budgetYear,
    page,
    q: parsed.q,
    kind: "disburse",
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          ทะเบียนสั่งจ่ายเงินงบประมาณ {activeYear.budgetYear}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {total.toLocaleString("th-TH")} รายการ
        </p>
      </div>

      <BudgetListFilters q={parsed.q} basePath="/modules/budget/disburse" />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">วันที่</th>
              <th className="px-3 py-3 font-medium">ที่เอกสาร</th>
              <th className="px-3 py-3 font-medium">รายการจ่าย</th>
              <th className="px-3 py-3 font-medium">งบรายจ่าย</th>
              <th className="px-3 py-3 text-right font-medium">จำนวนเงิน</th>
              <th className="px-3 py-3 text-center font-medium">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  ไม่พบรายการจ่าย
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {formatThaiDate(row.recDate)}
                  </td>
                  <td className="px-3 py-2.5">{row.doc}</td>
                  <td className="px-3 py-2.5">{row.item}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {row.payGroupName ?? row.payGroup ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {formatMoney(row.payAmount)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link href={`/modules/budget/disburse/${row.id}`} className="text-primary hover:underline">
                      ดู
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ListPagination
        page={page}
        totalPages={totalPages}
        hrefForPage={(p) => buildBudgetDisburseUrl({ page: p, q: parsed.q })}
      />
    </section>
  );
}
