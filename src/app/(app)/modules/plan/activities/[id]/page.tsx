import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { deletePlanActivity } from "@/lib/plan/actions";
import { formatMoney } from "@/lib/budget/constants";
import { canWritePlan } from "@/lib/plan/permissions";
import { getPlanActivity } from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function PlanActivityDetailPage({ params }: Props) {
  const { user } = await requirePlanAccess();
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const activity = await getPlanActivity(id);
  if (!activity) notFound();

  const canWrite = canWritePlan(user);

  async function handleDelete() {
    "use server";
    await deletePlanActivity(id);
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            กิจกรรม {activity.codeActi}
          </h2>
          <p className="text-sm text-muted-foreground">ปีงบประมาณ {activity.budgetYear}</p>
        </div>
        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/modules/plan/activities/${id}/edit`}
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
        <dt className="text-muted-foreground">ชื่อกิจกรรม</dt>
        <dd>{activity.nameActi}</dd>
        <dt className="text-muted-foreground">โครงการ</dt>
        <dd>
          {activity.codeProj} {activity.projectName ?? ""}
        </dd>
        <dt className="text-muted-foreground">งบกิจกรรม</dt>
        <dd>{formatMoney(activity.budgetActi)} บาท</dd>
        <dt className="text-muted-foreground">ระยะเวลา</dt>
        <dd>
          {formatThaiDate(activity.beginDate)} – {formatThaiDate(activity.finishDate)}
        </dd>
      </dl>

      <Link href="/modules/plan/activities" className="text-sm text-primary hover:underline">
        ← กลับรายการกิจกรรม
      </Link>
    </section>
  );
}
