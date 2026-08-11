import { redirect } from "next/navigation";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetReportSection } from "@/components/budget/budget-report-section";
import { formatMoney } from "@/lib/budget/constants";
import { canViewBudgetChecks } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetReserveMoney } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

export default async function BudgetCheckPayCheckReservePage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canViewBudgetChecks(user, perms)) redirect("/modules/budget");

  const year = await getActiveBudgetYear();
  if (!year) return <BudgetNoActiveYear />;

  const rows = await listBudgetReserveMoney(year.budgetYear);
  const table = {
    columns: [
      { key: "recDate", label: "วันที่" },
      { key: "document", label: "เลขที่" },
      { key: "item", label: "รายการ" },
      { key: "borrowedPerson", label: "ผู้ยืม/ผู้รับ" },
      { key: "payAmount", label: "จำนวนเงิน", align: "right" as const },
    ],
    rows: rows.map((r) => ({
      recDate: r.recDate,
      document: r.document,
      item: r.item,
      borrowedPerson: r.borrowedPerson,
      payAmount: r.payAmount,
    })),
  };

  return (
    <BudgetReportSection
      title={`ตรวจสอบการจ่ายเงินสำรองจ่าย ${year.budgetYear}`}
      description={`ยอดรวม ${formatMoney(rows.reduce((s, r) => s + (r.payAmount ?? 0), 0))} บาท`}
      table={table}
    />
  );
}
