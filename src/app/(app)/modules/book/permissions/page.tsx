import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { BookPermissionDeleteButton } from "@/components/book/permission-delete-button";
import { formatPersonName } from "@/lib/auth/format-name";
import { isBookModuleAdmin } from "@/lib/book/permissions";
import { listBookPermissions } from "@/lib/book/permissions/queries";
import { cn } from "@/lib/utils";

export default async function BookPermissionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!isBookModuleAdmin(session.user)) {
    redirect("/modules/book");
  }

  const rows = await listBookPermissions();

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">กำหนดเจ้าหน้าที่</h2>
          <p className="text-sm text-muted-foreground">
            จัดการสิทธิ์การใช้งานของเจ้าหน้าที่รับส่งหนังสือราชการ
          </p>
        </div>
        <Link
          href="/modules/book/permissions/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มเจ้าหน้าที่
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ชื่อเจ้าหน้าที่</th>
              <th className="px-3 py-3 text-center font-medium">สิทธิ์ทั่วไป (p1)</th>
              <th className="px-3 py-3 text-center font-medium">สิทธิ์บันทึก/ส่ง (p2)</th>
              <th className="px-3 py-3 text-center font-medium">ดูหนังสือลับ</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
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
                      <Check className="mx-auto size-5 text-green-600" aria-label="มีสิทธิ์" />
                    ) : (
                      <X className="mx-auto size-5 text-muted-foreground" aria-label="ไม่มีสิทธิ์" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.p2 === 1 ? (
                      <Check className="mx-auto size-5 text-green-600" aria-label="มีสิทธิ์" />
                    ) : (
                      <X className="mx-auto size-5 text-muted-foreground" aria-label="ไม่มีสิทธิ์" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.canViewSecret ? (
                      <Check className="mx-auto size-5 text-green-600" aria-label="มีสิทธิ์" />
                    ) : (
                      <X className="mx-auto size-5 text-muted-foreground" aria-label="ไม่มีสิทธิ์" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <BookPermissionDeleteButton id={row.id} />
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
