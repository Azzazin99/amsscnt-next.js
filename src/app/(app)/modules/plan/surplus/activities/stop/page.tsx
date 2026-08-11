import Link from "next/link";
import { PlanStopActivitiesForm } from "@/components/plan/plan-stop-activities-form";
import { getActivePlanYear, listActivitiesForStop } from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

export default async function PlanStopActivitiesPage() {
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

  const activities = await listActivitiesForStop(activeYear.budgetYear);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          หยุดกิจกรรม/โครงการ ปีงบประมาณ {activeYear.budgetYear}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ทำเครื่องหมายกิจกรรมที่ยุติ เพื่อคำนวณเงินเหลือจ่าย
        </p>
      </div>

      <PlanStopActivitiesForm budgetYear={activeYear.budgetYear} activities={activities} />
    </section>
  );
}
