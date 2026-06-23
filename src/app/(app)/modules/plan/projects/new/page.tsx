import Link from "next/link";
import { redirect } from "next/navigation";
import { PlanProjectForm } from "@/components/plan/plan-project-form";
import { createPlanProject } from "@/lib/plan/actions";
import { canWritePlan } from "@/lib/plan/permissions";
import {
  getActivePlanYear,
  listPersonOptions,
  listWorkgroupOptions,
  suggestNextProjectCode,
} from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

export default async function PlanProjectNewPage() {
  const { user } = await requirePlanAccess();
  if (!canWritePlan(user)) redirect("/modules/plan/projects");

  const activeYear = await getActivePlanYear();
  if (!activeYear) redirect("/modules/plan/years");

  const [workgroups, people, suggestedCodeProj] = await Promise.all([
    listWorkgroupOptions(),
    listPersonOptions(),
    suggestNextProjectCode(activeYear.budgetYear),
  ]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        เพิ่มโครงการ ปีงบประมาณ {activeYear.budgetYear}
      </h2>
      <PlanProjectForm
        action={createPlanProject}
        budgetYear={activeYear.budgetYear}
        workgroups={workgroups}
        people={people}
        suggestedCodeProj={suggestedCodeProj}
        cancelHref="/modules/plan/projects"
      />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/modules/plan/projects" className="text-primary hover:underline">
          กลับรายการโครงการ
        </Link>
      </p>
    </section>
  );
}
