import { redirect } from "next/navigation";
import { X } from "lucide-react";
import { LeaveYearActiveToggle } from "@/components/leave/leave-year-active-toggle";
import { LeaveYearDeleteButton } from "@/components/leave/leave-year-delete-button";
import { LeaveYearForm } from "@/components/leave/leave-year-form";
import { createLeaveYear } from "@/lib/leave/actions";
import { canManageLeaveSettings, getLeavePermissions } from "@/lib/leave/permissions";
import { listLeaveYears } from "@/lib/leave/queries";
import { requireLeaveScope } from "@/lib/leave/scope";

export default async function LaYearsPage() {
  const { user, perms } = await requireLeaveScope();
  if (!canManageLeaveSettings(user, perms)) {
    redirect("/modules/leave/requests");
  }

  const years = await listLeaveYears();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">กำหนดปีงบประมาณ</h2>

      <LeaveYearForm action={createLeaveYear} />

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
                    <LeaveYearActiveToggle id={row.id} active={row.yearActive} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.yearActive ? (
                      <X className="mx-auto size-5 text-muted-foreground/40" />
                    ) : (
                      <LeaveYearDeleteButton id={row.id} />
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
