import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { StudentPermissionDeleteButton } from "@/components/student-main/student-permission-delete-button";
import { buttonVariants } from "@/components/ui/button";
import { listStudentPermissions } from "@/lib/student-main/queries";
import { requireStudentStaffPermissionsAccess } from "@/lib/student-main/scope";
import { cn } from "@/lib/utils";

export default async function StudentMainPermissionsPage() {
  await requireStudentStaffPermissionsAccess();
  const rows = await listStudentPermissions();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">สิทธิ์การใช้งาน</h2>
        <Link href="/modules/student_main/permissions/new" className={cn(buttonVariants(), "inline-flex min-h-11")}>เพิ่มสิทธิ์</Link>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ชื่อ</th>
              <th className="px-3 py-3 text-center font-medium">p1</th>
              <th className="px-3 py-3 text-center font-medium">p2</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">ยังไม่มีสิทธิ์</td></tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id} className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5">{index + 1}</td>
                  <td className="px-3 py-2.5">{row.displayName}</td>
                  <td className="px-3 py-2.5 text-center">{row.p1 === 1 ? <Check className="mx-auto size-5 text-green-600" /> : <X className="mx-auto size-5 text-muted-foreground" />}</td>
                  <td className="px-3 py-2.5 text-center">{row.p2 === 1 ? <Check className="mx-auto size-5 text-green-600" /> : <X className="mx-auto size-5 text-muted-foreground" />}</td>
                  <td className="px-3 py-2.5 text-center"><StudentPermissionDeleteButton id={row.id} /></td>
                  <td className="px-3 py-2.5 text-center">
                    <Link href={`/modules/student_main/permissions/${row.id}/edit`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted" aria-label="แก้ไข"><Pencil className="size-4" /></Link>
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
