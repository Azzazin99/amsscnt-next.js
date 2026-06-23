import Link from "next/link";
import { Check, Pencil, X } from "lucide-react";
import { AdminPermissionDeleteButton } from "@/components/core/admin-permission-delete-button";
import { formatPersonName } from "@/lib/auth/format-name";
import { buttonVariants } from "@/components/ui/button";
import { deleteAdminRegisterPermission } from "@/lib/core/module-permissions/actions";
import { listDistrictRegisterPermissions } from "@/lib/bookregister/permissions/queries";
import { cn } from "@/lib/utils";

export default async function AdminPermissionsPage() {
  const rows = await listDistrictRegisterPermissions();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">สิทธิ์โมดูล</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ทะเบียนหนังสือ (bookregister) — p1 ดู / p2 แก้ / p3 ลบ
          </p>
        </div>
        <Link href="/admin/permissions/new" className={cn(buttonVariants(), "inline-flex min-h-11")}>
          เพิ่มสิทธิ์
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ผู้ใช้</th>
              <th className="px-3 py-3 text-center font-medium">p1</th>
              <th className="px-3 py-3 text-center font-medium">p2</th>
              <th className="px-3 py-3 text-center font-medium">p3</th>
              <th className="px-3 py-3 text-center font-medium">ลับ</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">ยังไม่มีสิทธิ์ — กด เพิ่มสิทธิ์</td></tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id} className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5">{index + 1}</td>
                  <td className="px-3 py-2.5">
                    {formatPersonName({ prefix: row.prefix, firstName: row.firstName, lastName: row.lastName, fallback: row.displayName })}
                  </td>
                  <td className="px-3 py-2.5 text-center">{row.p1 === 1 ? <Check className="mx-auto size-4 text-green-600" /> : <X className="mx-auto size-4 text-muted-foreground" />}</td>
                  <td className="px-3 py-2.5 text-center">{row.p2 === 1 ? <Check className="mx-auto size-4 text-green-600" /> : <X className="mx-auto size-4 text-muted-foreground" />}</td>
                  <td className="px-3 py-2.5 text-center">{row.p3 === 1 ? <Check className="mx-auto size-4 text-green-600" /> : <X className="mx-auto size-4 text-muted-foreground" />}</td>
                  <td className="px-3 py-2.5 text-center">{row.canViewSecret ? <Check className="mx-auto size-4 text-green-600" /> : <X className="mx-auto size-4 text-muted-foreground" />}</td>
                  <td className="px-3 py-2.5 text-center">
                    <Link href={`/admin/permissions/${row.id}/edit`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted" aria-label="แก้ไข">
                      <Pencil className="size-4" />
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <AdminPermissionDeleteButton id={row.id} deleteAction={deleteAdminRegisterPermission} />
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
