import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { auth } from "@/auth";
import { PersonPermissionDeleteButton } from "@/components/person/person-permission-delete-button";
import { formatPersonName } from "@/lib/auth/format-name";
import { buttonVariants } from "@/components/ui/button";
import {
  canManagePersonPermissions,
  getPersonPermissions,
} from "@/lib/person/permissions";
import { listPersonModulePermissions } from "@/lib/person/permissions/queries";
import { cn } from "@/lib/utils";

export default async function PersonPermissionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getPersonPermissions(Number(session.user.id));
  if (!canManagePersonPermissions(session.user, perms)) {
    redirect("/modules/person/staff");
  }

  const rows = await listPersonModulePermissions();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">สิทธิ์การใช้งาน</h2>
        <Link
          href="/modules/person/permissions/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มสิทธิ์
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ชื่อ</th>
              <th className="px-3 py-3 text-center font-medium">ดู (p1)</th>
              <th className="px-3 py-3 text-center font-medium">บันทึก (p2)</th>
              <th className="px-3 py-3 text-center font-medium">ปิด (p3)</th>
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
                  ยังไม่มีสิทธิ์ — กด &quot;เพิ่มสิทธิ์&quot;
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">{index + 1}</td>
                  <td className="px-3 py-2.5">
                    {formatPersonName({
                      prefix: row.prefix,
                      firstName: row.firstName,
                      lastName: row.lastName,
                      fallback: row.displayName,
                    })}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.p1 === 1 ? (
                      <Check className="mx-auto size-5 text-green-600" />
                    ) : (
                      <X className="mx-auto size-5 text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.p2 === 1 ? (
                      <Check className="mx-auto size-5 text-green-600" />
                    ) : (
                      <X className="mx-auto size-5 text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.p3 === 1 ? (
                      <Check className="mx-auto size-5 text-green-600" />
                    ) : (
                      <X className="mx-auto size-5 text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <PersonPermissionDeleteButton id={row.id} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/person/permissions/${row.id}/edit`}
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
