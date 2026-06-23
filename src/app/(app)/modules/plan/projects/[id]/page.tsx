import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { deletePlanProject } from "@/lib/plan/actions";
import { formatMoney } from "@/lib/budget/constants";
import { canWritePlan } from "@/lib/plan/permissions";
import { getPlanProject } from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function PlanProjectDetailPage({ params }: Props) {
  const { user } = await requirePlanAccess();
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const project = await getPlanProject(id);
  if (!project) notFound();

  const canWrite = canWritePlan(user);

  async function handleDelete() {
    "use server";
    const result = await deletePlanProject(id);
    if (result && !result.ok) {
      throw new Error(result.message);
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            โครงการ {project.codeProj}
          </h2>
          <p className="text-sm text-muted-foreground">ปีงบประมาณ {project.budgetYear}</p>
        </div>
        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/modules/plan/projects/${id}/edit`}
              className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
            >
              แก้ไข
            </Link>
            <form action={handleDelete}>
              <button
                type="submit"
                className={cn(buttonVariants({ variant: "destructive" }), "min-h-11")}
              >
                ลบ
              </button>
            </form>
          </div>
        ) : null}
      </div>

      <dl className="grid gap-3 rounded-xl border bg-card p-4 text-sm sm:grid-cols-[140px_1fr]">
        <dt className="text-muted-foreground">ชื่อโครงการ</dt>
        <dd>{project.nameProj}</dd>
        <dt className="text-muted-foreground">กลุ่มงาน</dt>
        <dd>{project.workgroupName ?? project.codeClus}</dd>
        <dt className="text-muted-foreground">งบจัดสรร</dt>
        <dd>{formatMoney(project.budgetProj)} บาท</dd>
        <dt className="text-muted-foreground">หัวหน้าโครงการ</dt>
        <dd>{project.ownerName ?? project.ownerProj ?? "—"}</dd>
        <dt className="text-muted-foreground">ระยะเวลา</dt>
        <dd>
          {formatThaiDate(project.beginDate)} – {formatThaiDate(project.finishDate)}
        </dd>
      </dl>

      <Link href="/modules/plan/projects" className="text-sm text-primary hover:underline">
        ← กลับรายการโครงการ
      </Link>
    </section>
  );
}
