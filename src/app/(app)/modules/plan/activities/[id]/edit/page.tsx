import { notFound, redirect } from "next/navigation";
import { PlanActivityForm } from "@/components/plan/plan-activity-form";
import { updatePlanActivity } from "@/lib/plan/actions";
import { canWritePlan } from "@/lib/plan/permissions";
import {
  getPlanActivity,
  listProjectOptions,
} from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

type Props = { params: Promise<{ id: string }> };

export default async function PlanActivityEditPage({ params }: Props) {
  const { user } = await requirePlanAccess();
  if (!canWritePlan(user)) redirect("/modules/plan/activities");

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const activity = await getPlanActivity(id);
  if (!activity) notFound();

  const projects = await listProjectOptions(activity.budgetYear);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        แก้ไขกิจกรรม {activity.codeActi}
      </h2>
      <PlanActivityForm
        action={updatePlanActivity.bind(null, id)}
        budgetYear={activity.budgetYear}
        projects={projects}
        cancelHref={`/modules/plan/activities/${id}`}
        defaultValues={{
          codeClus: activity.codeClus,
          codeProj: activity.codeProj,
          codeActi: activity.codeActi,
          nameActi: activity.nameActi,
          budgetActi: activity.budgetActi,
          beginDate: activity.beginDate,
          finishDate: activity.finishDate,
        }}
      />
    </section>
  );
}
