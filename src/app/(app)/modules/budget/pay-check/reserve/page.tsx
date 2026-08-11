import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { formatMoney } from "@/lib/budget/constants";
import { getActiveBudgetYear, listBudgetReserveMoney } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { formatThaiDate } from "@/lib/format/thai-date";

export default async function BudgetPayCheckReservePage() {
  await requireBudgetAccess();

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const rows = await listBudgetReserveMoney(activeYear.budgetYear);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        จ่ายเช็คเงินสำรองจ่าย {activeYear.budgetYear}
      </h2>
      <p className="text-sm text-muted-foreground">
        รายการเงินสำรองจ่ายทั้งหมดในปีงบประมาณ (มุมมองอ่านอย่างเดียว)
      </p>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">วันที่</th>
              <th className="px-3 py-3 font-medium">เลขที่</th>
              <th className="px-3 py-3 font-medium">รายการ</th>
              <th className="px-3 py-3 font-medium">ผู้ยืม/ผู้รับ</th>
              <th className="px-3 py-3 text-right font-medium">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  ไม่มีรายการ
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {formatThaiDate(row.recDate)}
                  </td>
                  <td className="px-3 py-2.5">{row.document}</td>
                  <td className="px-3 py-2.5">{row.item}</td>
                  <td className="px-3 py-2.5">{row.borrowedPerson || "—"}</td>
                  <td className="px-3 py-2.5 text-right">{formatMoney(row.payAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
