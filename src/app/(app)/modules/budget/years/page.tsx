import { redirect } from "next/navigation";
import { X } from "lucide-react";
import { BudgetYearActiveToggle } from "@/components/budget/budget-year-active-toggle";
import { BudgetYearDeleteButton } from "@/components/budget/budget-year-delete-button";
import { BudgetYearForm } from "@/components/budget/budget-year-form";
import { createBudgetYear } from "@/lib/budget/actions";
import { canManageBudgetSettings } from "@/lib/budget/permissions";
import { listBudgetYears } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

export default async function BudgetYearsPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetSettings(user, perms)) {
    redirect("/modules/budget/receive");
  }

  const years = await listBudgetYears();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">ปีงบประมาณ</h2>

      <BudgetYearForm action={createBudgetYear} />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ปีงบประมาณ (พ.ศ.)</th>
              <th className="px-3 py-3 text-center font-medium">ปีปัจจุบัน</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
            </tr>
          </thead>
          <tbody>
            {years.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  ยังไม่มีปีงบประมาณ
                </td>
              </tr>
            ) : (
              years.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">{index + 1}</td>
                  <td className="px-3 py-2.5 font-medium">{row.budgetYear}</td>
                  <td className="px-3 py-2.5 text-center">
                    <BudgetYearActiveToggle id={row.id} active={row.yearActive} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.yearActive ? (
                      <X className="mx-auto size-5 text-muted-foreground/40" />
                    ) : (
                      <BudgetYearDeleteButton id={row.id} />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
