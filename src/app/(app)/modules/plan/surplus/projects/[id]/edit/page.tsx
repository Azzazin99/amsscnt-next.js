import { notFound, redirect } from "next/navigation";
import { PlanProjectForm } from "@/components/plan/plan-project-form";
import { updatePlanProject } from "@/lib/plan/actions";
import { canWritePlan } from "@/lib/plan/permissions";
import {
  getPlanProject,
  listPersonOptions,
  listStrategyOptions,
  listWorkgroupOptions,
} from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

const BASE_PATH = "/modules/plan/surplus/projects";

type Props = { params: Promise<{ id: string }> };

export default async function SurplusProjectEditPage({ params }: Props) {
  const { user, perms } = await requirePlanAccess();
  if (!canWritePlan(user, perms)) redirect(BASE_PATH);

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const project = await getPlanProject(id);
  if (!project) notFound();

  const [workgroups, people, strategies] = await Promise.all([
    listWorkgroupOptions(),
    listPersonOptions(),
    listStrategyOptions(project.budgetYear),
  ]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        แก้ไขโครงการเงินเหลือจ่าย {project.codeProj}
      </h2>
      <PlanProjectForm
        action={updatePlanProject.bind(null, id)}
        budgetYear={project.budgetYear}
        workgroups={workgroups}
        people={people}
        strategies={strategies}
        cancelHref={`${BASE_PATH}/${id}`}
        defaultValues={{
          codeClus: project.codeClus,
          codeTegy: project.codeTegy,
          codeProj: project.codeProj,
          nameProj: project.nameProj,
          budgetProj: project.budgetProj,
          ownerProj: project.ownerProj,
          beginDate: project.beginDate,
          finishDate: project.finishDate,
        }}
      />
    </section>
  );
}
