import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { canManagePermissionSettings } from "@/lib/permission/permissions";
import { listPermissionGrantPersonRows } from "@/lib/permission/grant-persons-queries";
import { requirePermissionScope } from "@/lib/permission/scope";

export default async function PermissionGrantPersonsPage() {
  const { user, perms } = await requirePermissionScope();
  if (!canManagePermissionSettings(user, perms)) {
    redirect("/modules/permission/requests");
  }

  const rows = await listPermissionGrantPersonRows();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">กำหนดผู้อนุมัติ</h2>
      <p className="text-sm text-muted-foreground">
        กำหนดผู้บังคับบัญชาชั้นต้นและผู้อนุมัติขั้นสุดท้ายต่อผู้ขอ
      </p>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ชื่อ</th>
              <th className="px-3 py-3 font-medium">ตำแหน่ง</th>
              <th className="px-3 py-3 font-medium">หน่วยงาน</th>
              <th className="px-3 py-3 font-medium">ผู้บังคับบัญชาชั้นต้น</th>
              <th className="px-3 py-3 font-medium">ผู้อนุมัติ</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.personId}
                className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
              >
                <td className="px-3 py-2.5">{index + 1}</td>
                <td className="px-3 py-2.5">{row.displayName}</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {row.positionLabel}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {row.schoolName ?? "เขตพื้นที่"}
                </td>
                <td className="px-3 py-2.5">{row.groupPersonName ?? "—"}</td>
                <td className="px-3 py-2.5">{row.grantPersonName ?? "—"}</td>
                <td className="px-3 py-2.5 text-center">
                  <Link
                    href={`/modules/permission/grant-persons/${row.personId}/edit`}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted"
                    aria-label={`แก้ไข ${row.displayName}`}
                  >
                    <Pencil className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
