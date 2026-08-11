import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/budget/constants";
import { canManageBudgetAllocation } from "@/lib/budget/permissions";
import { getLegacyBudgetReceive } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { deleteBudgetAllocation } from "@/lib/budget/workflow-actions";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetAllocationDetailPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getLegacyBudgetReceive(id);
  if (!row) notFound();

  const canWrite = canManageBudgetAllocation(user, perms);

  async function handleDelete() {
    "use server";
    await deleteBudgetAllocation(id);
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">การจัดสรร #{row.id}</h2>
        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/modules/budget/allocation/${id}/edit`}
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

      <dl className="grid gap-3 rounded-xl border bg-card p-4 text-sm sm:grid-cols-[160px_1fr]">
        <dt className="text-muted-foreground">วันที่</dt>
        <dd>{formatThaiDate(row.recDate)}</dd>
        <dt className="text-muted-foreground">งวดที่</dt>
        <dd>{row.num}</dd>
        <dt className="text-muted-foreground">เลขที่หนังสือ</dt>
        <dd>{row.bookNumber || "—"}</dd>
        <dt className="text-muted-foreground">แผนงาน</dt>
        <dd>{row.plan}</dd>
        <dt className="text-muted-foreground">ผลผลิต/โครงการ</dt>
        <dd>{row.project || "—"}</dd>
        <dt className="text-muted-foreground">กิจกรรมหลัก</dt>
        <dd>{row.activity || "—"}</dd>
        <dt className="text-muted-foreground">รายละเอียดกิจกรรม</dt>
        <dd>{row.activity2}</dd>
        <dt className="text-muted-foreground">แหล่งของเงิน</dt>
        <dd>{row.mSource || "—"}</dd>
        <dt className="text-muted-foreground">จำนวนเงิน</dt>
        <dd>{formatMoney(row.money)} บาท</dd>
        <dt className="text-muted-foreground">ไฟล์แนบ</dt>
        <dd>{row.file || "—"}</dd>
      </dl>

      <Link href="/modules/budget/allocation" className="text-sm text-primary hover:underline">
        ← กลับทะเบียนจัดสรร
      </Link>
    </section>
  );
}
