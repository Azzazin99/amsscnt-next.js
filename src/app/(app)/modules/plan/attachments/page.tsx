import Link from "next/link";
import { Check, X } from "lucide-react";
import { PlanAttachmentUpload } from "@/components/plan/plan-attachment-upload";
import { getActivePlanYear, listProjectOptions } from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

export default async function PlanAttachmentsPage() {
  await requirePlanAccess();
  const activeYear = await getActivePlanYear();

  if (!activeYear) {
    return (
      <section className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>ยังไม่ได้กำหนดปีงบประมาณ — ไปที่เมนูปีงบประมาณเพื่อตั้งค่าก่อน</p>
        <Link href="/modules/plan/years" className="mt-4 inline-block text-primary hover:underline">
          กำหนดปีงบประมาณ
        </Link>
      </section>
    );
  }

  const projects = await listProjectOptions(activeYear.budgetYear);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        แนบเอกสารโครงการ ปีงบประมาณ {activeYear.budgetYear}
      </h2>

      <PlanAttachmentUpload
        projects={projects.map((p) => ({
          id: p.id,
          codeProj: p.codeProj,
          nameProj: p.nameProj,
        }))}
      />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">รหัส</th>
              <th className="px-3 py-3 font-medium">ชื่อโครงการ</th>
              <th className="px-3 py-3 text-center font-medium">มีเอกสาร</th>
              <th className="px-3 py-3 font-medium">ไฟล์</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  ไม่พบโครงการ
                </td>
              </tr>
            ) : (
              projects.map((p, i) => (
                <tr key={p.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5 font-mono">{p.codeProj}</td>
                  <td className="px-3 py-2.5">{p.nameProj}</td>
                  <td className="px-3 py-2.5 text-center">
                    {p.fileDetail ? (
                      <Check className="mx-auto size-4 text-primary" />
                    ) : (
                      <X className="mx-auto size-4 text-muted-foreground/40" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {p.fileDetail || "—"}
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
