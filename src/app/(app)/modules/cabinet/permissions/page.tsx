import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { CabinetPermissionDeleteButton } from "@/components/cabinet/cabinet-permission-delete-button";
import { buttonVariants } from "@/components/ui/button";
import { canManageCabinetStaffPermissions, getCabinetPermissions } from "@/lib/cabinet/permissions";
import { listCabinetPermissions } from "@/lib/cabinet/queries";
import { requireCabinetScope } from "@/lib/cabinet/scope";
import { cn } from "@/lib/utils";

export default async function CabinetPermissionsPage() {
  const { user } = await requireCabinetScope();
  const perms = await getCabinetPermissions(Number(user.id));
  if (!canManageCabinetStaffPermissions(user)) redirect("/modules/cabinet");

  const rows = await listCabinetPermissions();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">กำหนดเจ้าหน้าที่</h2>
        <Link
          href="/modules/cabinet/permissions/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มเจ้าหน้าที่
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ชื่อเจ้าหน้าที่</th>
              <th className="px-3 py-3 text-center font-medium">p1</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ยังไม่มีเจ้าหน้าที่
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">{index + 1}</td>
                  <td className="px-3 py-2.5">{row.displayName}</td>
                  <td className="px-3 py-2.5 text-center">
                    {row.p1 === 1 ? (
                      <Check className="mx-auto size-5 text-green-600" />
                    ) : (
                      <X className="mx-auto size-5 text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <CabinetPermissionDeleteButton id={row.id} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/cabinet/permissions/${row.id}/edit`}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted"
                      aria-label="แก้ไข"
                    >
                      <Pencil className="size-4" />
                    </Link>
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
