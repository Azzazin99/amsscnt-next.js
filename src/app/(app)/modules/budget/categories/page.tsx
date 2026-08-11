import { redirect } from "next/navigation";
import { canManageBudgetSettingsData } from "@/lib/budget/permissions";
import { listBudgetCategories } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { cn } from "@/lib/utils";

export default async function BudgetCategoriesPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetSettingsData(user, perms)) redirect("/modules/budget");

  const rows = await listBudgetCategories();

  return (
    <section className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-primary">ประเภท(หลัก)ของเงิน</h2>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[360px] text-sm border-collapse">
          <thead>
            <tr className="border-b bg-muted/60 text-left font-medium">
              <th className="px-4 py-3 font-medium border-r border-border/50 w-28">รหัส</th>
              <th className="px-4 py-3 font-medium">ประเภท(หลัก)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                  ยังไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.categoryId} className={cn("border-b last:border-0 hover:bg-muted/30 transition-colors", i % 2 === 0 ? "bg-card" : "bg-muted/15")}>
                  <td className="px-4 py-3 font-mono border-r border-border/30 font-medium">{row.categoryId}</td>
                  <td className="px-4 py-3 border-r border-border/30">{row.categoryName}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground">
        *เพจนี้ ไม่สามารถปรับแก้ได้ เจตนาแสดงเพื่อทำความเข้าใจในเบื้องต้นถึงประเภทของเงิน
      </p>
    </section>
  );
}
