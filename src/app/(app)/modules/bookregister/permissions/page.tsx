import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { auth } from "@/auth";
import { PermissionDeleteButton } from "@/components/bookregister/permission-delete-button";
import { formatPersonName } from "@/lib/auth/format-name";
import { buttonVariants } from "@/components/ui/button";
import {
  canManageBookregisterStaffPermissions,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { listDistrictRegisterPermissions } from "@/lib/bookregister/permissions/queries";
import { cn } from "@/lib/utils";

export default async function DistrictPermissionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canManageBookregisterStaffPermissions(session.user)) {
    redirect("/modules/bookregister");
  }

  const rows = await listDistrictRegisterPermissions();

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">เจ้าหน้าที่</h2>
        <Link
          href="/modules/bookregister/permissions/new"
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
              <th className="px-3 py-3 text-center font-medium">เจ้าหน้าที่</th>
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
                      <Check
                        className="mx-auto size-5 text-green-600"
                        aria-label="มีสิทธิ์"
                      />
                    ) : (
                      <X
                        className="mx-auto size-5 text-muted-foreground"
                        aria-label="ไม่มีสิทธิ์"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <PermissionDeleteButton id={row.id} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/bookregister/permissions/${row.id}/edit`}
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
    </>
  );
}
