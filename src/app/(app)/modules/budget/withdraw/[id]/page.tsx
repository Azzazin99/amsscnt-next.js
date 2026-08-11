import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney, payGroupLabel } from "@/lib/budget/constants";
import { canWithdrawBudget } from "@/lib/budget/permissions";
import { getBudgetWithdraw } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { deleteBudgetWithdraw } from "@/lib/budget/workflow-actions";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetWithdrawDetailPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetWithdraw(id);
  if (!row) notFound();

  const canWrite = canWithdrawBudget(user, perms);

  async function handleDelete() {
    "use server";
    await deleteBudgetWithdraw(id);
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">รายการขอเบิก #{row.id}</h2>
        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/modules/budget/withdraw/${id}/edit`}
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
        <dt className="text-muted-foreground">เลขที่เอกสาร</dt>
        <dd>{row.document}</dd>
        <dt className="text-muted-foreground">รายการ</dt>
        <dd>{row.item}</dd>
        <dt className="text-muted-foreground">กิจกรรม/โครงการ</dt>
        <dd>{row.pjActivity}</dd>
        <dt className="text-muted-foreground">ประเภทรายการจ่าย</dt>
        <dd>{row.payType ? payGroupLabel(Number.parseInt(row.payType, 10)) : "—"}</dd>
        <dt className="text-muted-foreground">จำนวนเงิน</dt>
        <dd>{formatMoney(row.money)} บาท</dd>
        <dt className="text-muted-foreground">ประเภท</dt>
        <dd>{row.borrowStatus === 1 ? "ยืมเงินโครงการ" : "ขอเบิก"}</dd>
      </dl>

      <Link href="/modules/budget/withdraw" className="text-sm text-primary hover:underline">
        ← กลับทะเบียนขอเบิก
      </Link>
    </section>
  );
}
