import Link from "next/link";
import { notFound } from "next/navigation";
import { PlanOwnerReportForm } from "@/components/plan/plan-owner-report-form";
import { savePlanOwnerReport } from "@/lib/plan/actions";
import { getPlanProjectOwnerReport } from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function OwnerResultDetailPage({
  params,
  searchParams,
}: Props) {
  const { user } = await requirePlanAccess();
  const { id: idParam } = await params;
  const { edit } = await searchParams;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const project = await getPlanProjectOwnerReport(id);
  if (!project) notFound();

  const isOwner = project.ownerProj === user.personId;
  const editMode = edit === "1" && isOwner;

  async function handleSave(formData: FormData) {
    "use server";
    const result = await savePlanOwnerReport(id, formData);
    if (result && !result.ok) {
      throw new Error(result.message);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          รายงานโครงการ {project.codeProj}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {project.nameProj} · ปีงบประมาณ {project.budgetYear}
        </p>
        <p className="text-sm text-muted-foreground">
          หัวหน้าโครงการ: {project.ownerName || project.ownerProj || "—"}
        </p>
      </div>

      {editMode ? (
        <PlanOwnerReportForm
          evalActivity={project.evalActivity}
          evalResult={project.evalResult}
          evalObstacle={project.evalObstacle}
          action={handleSave}
        />
      ) : (
        <dl className="grid gap-4 rounded-xl border bg-card p-6 text-sm">
          <div>
            <dt className="font-medium text-muted-foreground">วิธีการดำเนินงาน</dt>
            <dd className="mt-1 whitespace-pre-wrap">{project.evalActivity || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">ผลการดำเนินงาน</dt>
            <dd className="mt-1 whitespace-pre-wrap">{project.evalResult || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">ข้อค้นพบหรือข้อเสนอแนะ</dt>
            <dd className="mt-1 whitespace-pre-wrap">{project.evalObstacle || "—"}</dd>
          </div>
        </dl>
      )}

      <div className="flex flex-wrap gap-4 text-sm">
        <Link
          href="/modules/plan/reports/owner-results"
          className="text-primary hover:underline"
        >
          ← กลับรายงานผลการดำเนินงาน
        </Link>
        {isOwner && !editMode ? (
          <Link
            href={`/modules/plan/reports/owner-results/${id}?edit=1`}
            className="text-primary hover:underline"
          >
            เขียนรายงาน
          </Link>
        ) : null}
      </div>
    </section>
  );
}
