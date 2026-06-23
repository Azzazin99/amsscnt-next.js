import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { deleteBudgetDisburse } from "@/lib/budget/actions";
import { formatMoney } from "@/lib/budget/constants";
import { canWriteBudgetDisburse } from "@/lib/budget/permissions";
import { getBudgetMain } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetDisburseDetailPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetMain(id);
  if (!row || row.payAmount == null) notFound();

  const canWrite = canWriteBudgetDisburse(user, perms);

  async function handleDelete() {
    "use server";
    await deleteBudgetDisburse(id);
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">รายการจ่าย #{row.id}</h2>
        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/modules/budget/disburse/${id}/edit`}
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
        <dt className="text-muted-foreground">วันที่</dt>
        <dd>{formatThaiDate(row.recDate)}</dd>
        <dt className="text-muted-foreground">ที่เอกสาร</dt>
        <dd>{row.doc}</dd>
        <dt className="text-muted-foreground">รายการจ่าย</dt>
        <dd>{row.item}</dd>
        <dt className="text-muted-foreground">งบรายจ่าย</dt>
        <dd>{row.payGroupName ?? row.payGroup ?? "—"}</dd>
        <dt className="text-muted-foreground">จำนวนเงิน</dt>
        <dd>{formatMoney(row.payAmount)} บาท</dd>
        <dt className="text-muted-foreground">ผู้รับเงิน</dt>
        <dd>{row.payedPerson ?? "—"}</dd>
        <dt className="text-muted-foreground">ผู้บันทึก</dt>
        <dd>{row.officerName ?? row.officer ?? "—"}</dd>
      </dl>

      <Link href="/modules/budget/disburse" className="text-sm text-primary hover:underline">
        ← กลับทะเบียนจ่าย
      </Link>
    </section>
  );
}
