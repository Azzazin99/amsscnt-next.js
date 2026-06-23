import { notFound, redirect } from "next/navigation";
import { PlanProjectForm } from "@/components/plan/plan-project-form";
import { updatePlanProject } from "@/lib/plan/actions";
import { canWritePlan } from "@/lib/plan/permissions";
import {
  getPlanProject,
  listPersonOptions,
  listWorkgroupOptions,
} from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

type Props = { params: Promise<{ id: string }> };

export default async function PlanProjectEditPage({ params }: Props) {
  const { user } = await requirePlanAccess();
  if (!canWritePlan(user)) redirect("/modules/plan/projects");

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const project = await getPlanProject(id);
  if (!project) notFound();

  const [workgroups, people] = await Promise.all([
    listWorkgroupOptions(),
    listPersonOptions(),
  ]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        แก้ไขโครงการ {project.codeProj}
      </h2>
      <PlanProjectForm
        action={updatePlanProject.bind(null, id)}
        budgetYear={project.budgetYear}
        workgroups={workgroups}
        people={people}
        cancelHref={`/modules/plan/projects/${id}`}
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
