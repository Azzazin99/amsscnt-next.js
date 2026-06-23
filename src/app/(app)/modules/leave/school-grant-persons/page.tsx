import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { LeaveSchoolGrantDeleteButton } from "@/components/leave/leave-school-grant-delete-button";
import { buttonVariants } from "@/components/ui/button";
import { canManageLeaveSettings } from "@/lib/leave/permissions";
import { requireLeaveScope } from "@/lib/leave/scope";
import { listSchoolGrantDeputies } from "@/lib/leave/school-grant-queries";
import { cn } from "@/lib/utils";

export default async function LeaveSchoolGrantPersonsPage() {
  const { user, perms } = await requireLeaveScope();
  if (!canManageLeaveSettings(user, perms)) {
    redirect("/modules/leave/requests");
  }

  const rows = await listSchoolGrantDeputies();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">
          กำหนดผู้อนุมัติ (รร.)
        </h2>
        <Link
          href="/modules/leave/school-grant-persons/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มรอง ผอ.เขต
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ชื่อ</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ยังไม่มีรายการ — กด &quot;เพิ่มรอง ผอ.เขต&quot;
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
                    <LeaveSchoolGrantDeleteButton id={row.id} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/leave/school-grant-persons/${row.id}/edit`}
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
