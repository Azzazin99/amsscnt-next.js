import Link from "next/link";
import { redirect } from "next/navigation";
import { PlanActivityForm } from "@/components/plan/plan-activity-form";
import { createPlanActivity } from "@/lib/plan/actions";
import { canWritePlan } from "@/lib/plan/permissions";
import { getActivePlanYear, listProjectOptions } from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

type Props = {
  searchParams: Promise<{ proj?: string }>;
};

export default async function PlanActivityNewPage({ searchParams }: Props) {
  const { user } = await requirePlanAccess();
  if (!canWritePlan(user)) redirect("/modules/plan/activities");

  const activeYear = await getActivePlanYear();
  if (!activeYear) redirect("/modules/plan/years");

  const params = await searchParams;
  const projects = await listProjectOptions(activeYear.budgetYear);
  if (projects.length === 0) {
    return (
      <section className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>ยังไม่มีโครงการในปีนี้ — สร้างโครงการก่อน</p>
        <Link href="/modules/plan/projects/new" className="mt-4 inline-block text-primary hover:underline">
          เพิ่มโครงการ
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        เพิ่มกิจกรรม ปีงบประมาณ {activeYear.budgetYear}
      </h2>
      <PlanActivityForm
        action={createPlanActivity}
        budgetYear={activeYear.budgetYear}
        projects={projects}
        initialCodeProj={params.proj}
        cancelHref="/modules/plan/activities"
      />
    </section>
  );
}
