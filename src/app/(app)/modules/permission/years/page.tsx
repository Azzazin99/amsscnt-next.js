import { redirect } from "next/navigation";
import { X } from "lucide-react";
import { PermissionYearActiveToggle } from "@/components/permission/permission-year-active-toggle";
import { PermissionYearDeleteButton } from "@/components/permission/permission-year-delete-button";
import { PermissionYearForm } from "@/components/permission/permission-year-form";
import { createPermissionYear } from "@/lib/permission/actions";
import {
  canManagePermissionSettings,
  getPermissionModuleFlags,
} from "@/lib/permission/permissions";
import { listPermissionYears } from "@/lib/permission/queries";
import { requirePermissionScope } from "@/lib/permission/scope";

export default async function PermissionYearsPage() {
  const { user, perms } = await requirePermissionScope();
  if (!canManagePermissionSettings(user, perms)) {
    redirect("/modules/permission/requests");
  }

  const years = await listPermissionYears();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">ปีงบประมาณ</h2>

      <PermissionYearForm action={createPermissionYear} />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ปีงบประมาณ (พ.ศ.)</th>
              <th className="px-3 py-3 text-center font-medium">ปีปัจจุบัน</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
            </tr>
          </thead>
          <tbody>
            {years.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ยังไม่มีปีงบประมาณ — กรอกด้านบนแล้วกด &quot;เพิ่มปี&quot;
                </td>
              </tr>
            ) : (
              years.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">{index + 1}</td>
                  <td className="px-3 py-2.5 font-medium">{row.budgetYear}</td>
                  <td className="px-3 py-2.5 text-center">
                    <PermissionYearActiveToggle id={row.id} active={row.yearActive} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.yearActive ? (
                      <X className="mx-auto size-5 text-muted-foreground/40" />
                    ) : (
                      <PermissionYearDeleteButton id={row.id} />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground">
        มีได้เพียงหนึ่งปีที่ตั้งเป็น &quot;ปีปัจจุบัน&quot; — คลิกไอคอนในตารางเพื่อสลับ
      </p>
    </section>
  );
}
