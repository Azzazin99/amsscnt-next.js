import Link from "next/link";
import { Check, Pencil, X } from "lucide-react";
import { MailPermissionDeleteButton } from "@/components/mail/mail-permission-delete-button";
import { buttonVariants } from "@/components/ui/button";
import { listMailPermissions } from "@/lib/mail/queries";
import { requireMailStaffPermissionsAccess } from "@/lib/mail/scope";
import { cn } from "@/lib/utils";

export default async function MailPermissionsPage() {
  await requireMailStaffPermissionsAccess();
  const rows = await listMailPermissions();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">เจ้าหน้าที่</h2>
        <Link
          href="/modules/mail/permissions/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มเจ้าหน้าที่
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ชื่อ</th>
              <th className="px-3 py-3 text-center font-medium">เจ้าหน้าที่</th>
              <th className="px-3 py-3 font-medium">เลขบัตรเจ้าหน้าที่</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
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
                  <td className="px-3 py-2.5">{row.displayName}</td>
                  <td className="px-3 py-2.5 text-center">
                    {row.p1 === 1 ? (
                      <Check className="mx-auto size-5 text-green-600" />
                    ) : (
                      <X className="mx-auto size-5 text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {row.officerPersonId ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <MailPermissionDeleteButton id={row.id} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/mail/permissions/${row.id}/edit`}
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
