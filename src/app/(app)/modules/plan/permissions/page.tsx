import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { deletePlanStaffPermission } from "@/lib/plan/settings-actions";
import { canManagePlanStaffPermissions } from "@/lib/plan/permissions";
import { listPlanStaffPermissions } from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";
import { cn } from "@/lib/utils";

function PermMark({ on }: { on: number }) {
  return on ? (
    <Check className="mx-auto size-4 text-primary" />
  ) : (
    <X className="mx-auto size-4 text-muted-foreground/40" />
  );
}

export default async function PlanPermissionsPage() {
  const { user } = await requirePlanAccess();
  if (!canManagePlanStaffPermissions(user)) redirect("/modules/plan/projects");

  const rows = await listPlanStaffPermissions();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">กำหนดเจ้าหน้าที่แผนงาน</h2>
        <Link
          href="/modules/plan/permissions/new"
          className={cn(buttonVariants(), "min-h-11")}
        >
          เพิ่มเจ้าหน้าที่
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">บุคลากร</th>
              <th className="px-3 py-3 text-center font-medium">เพิ่ม</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
              <th className="px-3 py-3 text-center font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  ยังไม่มีเจ้าหน้าที่
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                async function handleDelete() {
                  "use server";
                  await deletePlanStaffPermission(row.id);
                }
                return (
                  <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                    <td className="px-3 py-2.5">{i + 1}</td>
                    <td className="px-3 py-2.5">{row.displayName || row.personId}</td>
                    <td className="px-3 py-2.5">
                      <PermMark on={row.permAdd} />
                    </td>
                    <td className="px-3 py-2.5">
                      <PermMark on={row.permEdit} />
                    </td>
                    <td className="px-3 py-2.5">
                      <PermMark on={row.permDele} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Link
                          href={`/modules/plan/permissions/${row.id}/edit`}
                          className="text-primary hover:underline"
                        >
                          แก้ไข
                        </Link>
                        <form action={handleDelete}>
                          <button type="submit" className="text-destructive hover:underline">
                            ลบ
                          </button>
                        </form>
                      </div>
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
