import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, X, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BUDGET_PERMISSION_FIELDS } from "@/lib/budget/constants";
import { canManageBudgetStaffPermissions } from "@/lib/budget/permissions";
import { listBudgetStaffPermissions } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { deleteBudgetStaffPermission } from "@/lib/budget/settings-actions";
import { cn } from "@/lib/utils";

function PermMark({ on }: { on: number }) {
  return on ? (
    <Check className="mx-auto size-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
  ) : (
    <X className="mx-auto size-4 text-rose-500/80 dark:text-rose-400/80 stroke-[3]" />
  );
}

export default async function BudgetPermissionsPage() {
  const { user } = await requireBudgetAccess();
  if (!canManageBudgetStaffPermissions(user)) redirect("/modules/budget");

  const rows = await listBudgetStaffPermissions();

  return (
    <section className="space-y-4">
      <h2 className="text-center text-xl font-bold text-primary">
        เจ้าหน้าที่การเงินและบัญชี
      </h2>

      <div>
        <Link
          href="/modules/budget/permissions/new"
          className={cn(buttonVariants({ variant: "outline" }), "min-h-10 border-input shadow-sm")}
        >
          เพิ่มเจ้าหน้าที่
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[960px] text-sm border-collapse">
          <thead>
            <tr className="border-b bg-muted/60 text-center font-medium">
              <th rowSpan={2} className="px-3 py-2 border-r border-border/50 w-12">
                ที่
              </th>
              <th rowSpan={2} className="px-4 py-2 text-left border-r border-border/50 min-w-44">
                ชื่อเจ้าหน้าที่
              </th>
              <th colSpan={BUDGET_PERMISSION_FIELDS.length} className="px-2 py-1.5 border-b border-r border-border/50 font-semibold bg-muted/80">
                สิทธิ์
              </th>
              <th rowSpan={2} className="px-3 py-2 border-r border-border/50 w-14">
                ลบ
              </th>
              <th rowSpan={2} className="px-3 py-2 w-14">
                แก้ไข
              </th>
            </tr>
            <tr className="border-b bg-muted/40 text-center text-xs font-medium">
              {BUDGET_PERMISSION_FIELDS.map((p) => (
                <th key={p.name} className="px-1.5 py-2 border-r border-border/40 last:border-r-0 max-w-20 leading-snug">
                  {p.shortLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={BUDGET_PERMISSION_FIELDS.length + 4}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ยังไม่มีเจ้าหน้าที่
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                async function handleDelete() {
                  "use server";
                  await deleteBudgetStaffPermission(row.id);
                }
                return (
                  <tr key={row.id} className={cn("border-b last:border-0 hover:bg-muted/30 transition-colors", i % 2 === 0 ? "bg-card" : "bg-muted/15")}>
                    <td className="px-3 py-2.5 text-center font-medium border-r border-border/30">{i + 1}</td>
                    <td className="px-4 py-2.5 border-r border-border/30 font-medium">{row.displayName || row.personId}</td>
                    {BUDGET_PERMISSION_FIELDS.map((p) => (
                      <td key={p.name} className="px-1 py-2.5 text-center border-r border-border/30">
                        <PermMark on={row[p.name]} />
                      </td>
                    ))}
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
                        href={`/modules/budget/permissions/${row.id}/edit`}
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
