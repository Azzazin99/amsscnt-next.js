import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canManageBudgetSettingsData } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetTypes } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import {
  copyBudgetTypeFromPrevYear,
  deleteBudgetType,
} from "@/lib/budget/settings-actions";
import { cn } from "@/lib/utils";

export default async function BudgetTypesPage() {
  const { user, perms } = await requireBudgetAccess();
  if (!canManageBudgetSettingsData(user, perms)) redirect("/modules/budget");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const rows = await listBudgetTypes(activeYear.budgetYear);

  async function handleCopy() {
    "use server";
    await copyBudgetTypeFromPrevYear();
  }

  return (
    <section className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-primary">
          ประเภท(ย่อย)ของเงินนอกงบประมาณ และเงินรายได้แผ่นดิน ปีงบประมาณ {activeYear.budgetYear}
        </h2>
      </div>

      <div className="flex flex-wrap items-center justify-start gap-2">
        <Link href="/modules/budget/types/new" className={cn(buttonVariants({ variant: "outline" }), "min-h-10 border-input shadow-sm")}>
          เพิ่มข้อมูล
        </Link>
        {rows.length === 0 ? (
          <form action={handleCopy}>
            <button
              type="submit"
              className={cn(buttonVariants({ variant: "outline" }), "min-h-10 border-input shadow-sm")}
            >
              คัดลอกข้อมูลจากปีเก่า
            </button>
          </form>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[650px] text-sm border-collapse">
          <thead>
            <tr className="border-b bg-muted/60 text-left font-medium">
              <th className="px-3 py-3 font-medium text-center w-12 border-r border-border/50">ที่</th>
              <th className="px-3 py-3 font-medium border-r border-border/50 w-24">รหัส</th>
              <th className="px-3 py-3 font-medium border-r border-border/50 w-28">ปีงบประมาณ</th>
              <th className="px-3 py-3 font-medium border-r border-border/50">ประเภท(ย่อย)</th>
              <th className="px-3 py-3 font-medium border-r border-border/50">ประเภท(หลัก)</th>
              <th className="px-3 py-3 text-center font-medium w-14 border-r border-border/50">ลบ</th>
              <th className="px-3 py-3 text-center font-medium w-14">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  ยังไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                async function handleDelete() {
                  "use server";
                  await deleteBudgetType(row.id);
                }
                return (
                  <tr key={row.id} className={cn("border-b last:border-0 hover:bg-muted/30 transition-colors", i % 2 === 0 ? "bg-card" : "bg-muted/15")}>
                    <td className="px-3 py-2.5 text-center font-medium border-r border-border/30">{i + 1}</td>
                    <td className="px-3 py-2.5 font-mono border-r border-border/30 font-medium">{row.typeId}</td>
                    <td className="px-3 py-2.5 border-r border-border/30 font-medium">{activeYear.budgetYear}</td>
                    <td className="px-3 py-2.5 border-r border-border/30">{row.typeName}</td>
                    <td className="px-3 py-2.5 border-r border-border/30 text-muted-foreground">
                      {row.categoryName ?? row.categoryId}
                    </td>
                    <td className="px-2 py-2.5 text-center border-r border-border/30">
                      <form action={handleDelete} className="inline-flex">
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
                        href={`/modules/budget/types/${row.id}/edit`}
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
