import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  changeStatusLabel,
  formatMoney,
  payGroupLabel,
  receiveStatusLabel,
} from "@/lib/budget/constants";
import type { BudgetMainDetail } from "@/lib/budget/queries";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type Mode = "receive" | "pay" | "change";

type Props = {
  row: BudgetMainDetail;
  mode: Mode;
  basePath: string;
  backLabel: string;
  canWrite: boolean;
  deleteAction?: () => Promise<void>;
};

export function BudgetMainDetailView({
  row,
  mode,
  basePath,
  backLabel,
  canWrite,
  deleteAction,
}: Props) {
  const amount =
    mode === "receive"
      ? row.receiveAmount
      : mode === "change"
        ? row.changeAmount
        : row.payAmount;

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">รายการ #{row.id}</h2>
        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`${basePath}/${row.id}/edit`}
              className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
            >
              แก้ไข
            </Link>
            {deleteAction ? (
              <form action={deleteAction}>
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "destructive" }), "min-h-11")}
                >
                  ลบ
                </button>
              </form>
            ) : null}
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
        {mode === "pay" ? (
          <>
            <dt className="text-muted-foreground">งบรายจ่าย</dt>
            <dd>{row.payGroupName ?? payGroupLabel(row.payGroup)}</dd>
            <dt className="text-muted-foreground">ผู้รับเงิน</dt>
            <dd>{row.payedPerson ?? "—"}</dd>
          </>
        ) : (
          <>
            <dt className="text-muted-foreground">ลักษณะรายการ</dt>
            <dd>
              {mode === "change"
                ? changeStatusLabel(row.status)
                : receiveStatusLabel(row.status)}
            </dd>
          </>
        )}
        <dt className="text-muted-foreground">จำนวนเงิน</dt>
        <dd>{formatMoney(amount)} บาท</dd>
        <dt className="text-muted-foreground">ผู้บันทึก</dt>
        <dd>{row.officerName || row.officer || "—"}</dd>
      </dl>

      <Link href={basePath} className="text-sm text-primary hover:underline">
        ← {backLabel}
      </Link>
    </section>
  );
}
