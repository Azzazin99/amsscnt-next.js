import Link from "next/link";
import { redirect } from "next/navigation";
import { PlanProjectForm } from "@/components/plan/plan-project-form";
import { PLAN_PROJECT_KIND } from "@/lib/db/schema";
import { createSurplusPlanProject } from "@/lib/plan/actions";
import { canWritePlan } from "@/lib/plan/permissions";
import {
  getActivePlanYear,
  listPersonOptions,
  listStrategyOptions,
  listWorkgroupOptions,
  suggestNextProjectCode,
} from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

const BASE_PATH = "/modules/plan/surplus/projects";

export default async function SurplusProjectNewPage() {
  const { user, perms } = await requirePlanAccess();
  if (!canWritePlan(user, perms)) redirect(BASE_PATH);

  const activeYear = await getActivePlanYear();
  if (!activeYear) redirect("/modules/plan/years");

  const [workgroups, people, strategies, suggestedCodeProj] = await Promise.all([
    listWorkgroupOptions(),
    listPersonOptions(),
    listStrategyOptions(activeYear.budgetYear),
    suggestNextProjectCode(activeYear.budgetYear, PLAN_PROJECT_KIND.surplus),
  ]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        เพิ่มโครงการเงินเหลือจ่าย ปีงบประมาณ {activeYear.budgetYear}
      </h2>
      <PlanProjectForm
        action={createSurplusPlanProject}
        budgetYear={activeYear.budgetYear}
        workgroups={workgroups}
        people={people}
        strategies={strategies}
        suggestedCodeProj={suggestedCodeProj}
        cancelHref={BASE_PATH}
      />
      <p className="text-center text-sm text-muted-foreground">
        <Link href={BASE_PATH} className="text-primary hover:underline">
          กลับรายการโครงการ
        </Link>
      </p>
    </section>
  );
}
