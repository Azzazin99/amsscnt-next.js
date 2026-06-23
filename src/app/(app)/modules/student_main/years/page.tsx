import { X } from "lucide-react";
import { StudentEdYearActiveToggle } from "@/components/student-main/student-ed-year-active-toggle";
import { StudentEdYearDeleteButton } from "@/components/student-main/student-ed-year-delete-button";
import { StudentEdYearForm } from "@/components/student-main/student-ed-year-form";
import { createStudentEdYear } from "@/lib/student-main/actions";
import { listStudentEdYears } from "@/lib/student-main/queries";
import { requireStudentSettingsAccess } from "@/lib/student-main/scope";

export default async function StudentMainYearsPage() {
  await requireStudentSettingsAccess();
  const years = await listStudentEdYears();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">ปีการศึกษา</h2>
      <StudentEdYearForm action={createStudentEdYear} />
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ปีการศึกษา (พ.ศ.)</th>
              <th className="px-3 py-3 text-center font-medium">ปีปัจจุบัน</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
            </tr>
          </thead>
          <tbody>
            {years.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">ยังไม่มีปีการศึกษา</td></tr>
            ) : (
              years.map((row, index) => (
                <tr key={row.id} className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5">{index + 1}</td>
                  <td className="px-3 py-2.5 font-medium">{row.edYear}</td>
                  <td className="px-3 py-2.5 text-center"><StudentEdYearActiveToggle id={row.id} active={row.yearActive} /></td>
                  <td className="px-3 py-2.5 text-center">{row.yearActive ? <X className="mx-auto size-5 text-muted-foreground/40" /> : <StudentEdYearDeleteButton id={row.id} />}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
