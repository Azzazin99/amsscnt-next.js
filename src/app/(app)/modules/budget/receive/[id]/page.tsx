import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { deleteBudgetReceive } from "@/lib/budget/actions";
import {
  formatMoney,
  receiveStatusLabel,
} from "@/lib/budget/constants";
import { canWriteBudgetReceive } from "@/lib/budget/permissions";
import { getBudgetMain } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetReceiveDetailPage({ params }: Props) {
  const { user, perms } = await requireBudgetAccess();
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetMain(id);
  if (!row || row.receiveAmount == null) notFound();

  const canWrite = canWriteBudgetReceive(user, perms);

  async function handleDelete() {
    "use server";
    await deleteBudgetReceive(id);
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">รายการรับ #{row.id}</h2>
        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/modules/budget/receive/${id}/edit`}
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
        <dt className="text-muted-foreground">รายการ</dt>
        <dd>{row.item}</dd>
        <dt className="text-muted-foreground">ลักษณะรายการ</dt>
        <dd>{receiveStatusLabel(row.status)}</dd>
        <dt className="text-muted-foreground">จำนวนเงิน</dt>
        <dd>{formatMoney(row.receiveAmount)} บาท</dd>
        <dt className="text-muted-foreground">ผู้บันทึก</dt>
        <dd>{row.officerName ?? row.officer ?? "—"}</dd>
      </dl>

      <Link href="/modules/budget/receive" className="text-sm text-primary hover:underline">
        ← กลับทะเบียนรับ
      </Link>
    </section>
  );
}
