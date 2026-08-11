import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { auth } from "@/auth";
import { PersonPermissionDeleteButton } from "@/components/person/person-permission-delete-button";
import { formatPersonName } from "@/lib/auth/format-name";
import { buttonVariants } from "@/components/ui/button";
import {
  canManagePersonStaffPermissions,
  getPersonPermissions,
} from "@/lib/person/permissions";
import { listPersonModulePermissions } from "@/lib/person/permissions/queries";
import { cn } from "@/lib/utils";

export default async function PersonSysAdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getPersonPermissions(Number(session.user.id));
  if (!canManagePersonStaffPermissions(session.user)) {
    redirect("/modules/person/staff");
  }

  const rows = await listPersonModulePermissions();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            เจ้าหน้าที่ระบบข้อมูลพื้นฐานครูและบุคลากร
          </h2>
          <p className="text-xs text-muted-foreground">
            รายชื่อและสิทธิ์การใช้งานเจ้าหน้าที่จัดการข้อมูลพื้นฐานครูและบุคลากร สพท. ({rows.length} คน)
          </p>
        </div>
        <Link
          href="/modules/person/settings/sys-admin/new"
          className={cn(buttonVariants({ variant: "default" }), "min-h-10")}
        >
          เพิ่มเจ้าหน้าที่
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="w-16 px-4 py-3 text-center font-medium">ที่</th>
              <th className="px-4 py-3 font-medium">ชื่อเจ้าหน้าที่</th>
              <th className="w-32 px-4 py-3 text-center font-medium">สิทธิ์เจ้าหน้าที่</th>
              <th className="w-20 px-4 py-3 text-center font-medium">ลบ</th>
              <th className="w-20 px-4 py-3 text-center font-medium">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  ยังไม่มีเจ้าหน้าที่ — กด &quot;เพิ่มเจ้าหน้าที่&quot;
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="border-b transition-colors last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-2.5 text-center text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="px-4 py-2.5 font-medium">
                    {formatPersonName({
                      prefix: row.prefix,
                      firstName: row.firstName,
                      lastName: row.lastName,
                      fallback: row.displayName,
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {row.p2 === 1 || row.p1 === 1 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <Check className="size-3.5" />
                        อนุญาต
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                        <X className="size-3.5" />
                        ระงับ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <PersonPermissionDeleteButton id={row.id} />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Link
                      href={`/modules/person/permissions/${row.id}/edit`}
                      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
