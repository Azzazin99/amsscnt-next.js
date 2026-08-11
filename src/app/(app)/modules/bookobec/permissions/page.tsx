import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { BookobecPermissionDeleteButton } from "@/components/bookobec/bookobec-permission-delete-button";
import { buttonVariants } from "@/components/ui/button";
import { canManageBookobecStaffPermissions } from "@/lib/bookobec/permissions";
import { listBookobecPermissions } from "@/lib/bookobec/queries";
import { requireBookobecScope } from "@/lib/bookobec/scope";
import { cn } from "@/lib/utils";

export default async function BookobecPermissionsPage() {
  const { user } = await requireBookobecScope();
  if (!canManageBookobecStaffPermissions(user)) {
    redirect("/modules/bookobec/inbox");
  }

  const rows = await listBookobecPermissions();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">กำหนดเจ้าหน้าที่</h2>
        <Link
          href="/modules/bookobec/permissions/new"
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
              <th className="px-3 py-3 text-center font-medium">รับ</th>
              <th className="px-3 py-3 text-center font-medium">ส่ง</th>
              <th className="px-3 py-3 font-medium">เลขบัตรเจ้าหน้าที่</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ยังไม่มีเจ้าหน้าที่ — กด &quot;เพิ่มเจ้าหน้าที่&quot;
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
                      <Check
                        className="mx-auto size-5 text-green-600"
                        aria-label="รับ — มีสิทธิ์"
                      />
                    ) : (
                      <X
                        className="mx-auto size-5 text-muted-foreground"
                        aria-label="รับ — ไม่มีสิทธิ์"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.p2 === 1 ? (
                      <Check
                        className="mx-auto size-5 text-green-600"
                        aria-label="ส่ง — มีสิทธิ์"
                      />
                    ) : (
                      <X
                        className="mx-auto size-5 text-muted-foreground"
                        aria-label="ส่ง — ไม่มีสิทธิ์"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {row.officerPersonId ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <BookobecPermissionDeleteButton id={row.id} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/bookobec/permissions/${row.id}/edit`}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted"
                      title="แก้ไข"
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
