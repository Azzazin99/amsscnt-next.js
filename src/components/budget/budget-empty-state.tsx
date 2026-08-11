import Link from "next/link";

type BudgetEmptyStateProps = {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
};

export function BudgetEmptyState({
  title,
  message,
  actionHref,
  actionLabel,
}: BudgetEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {actionHref ? (
        <Link
          href={actionHref}
          className="mt-4 inline-block text-primary hover:underline"
        >
          {actionLabel ?? "ไปที่หน้าตั้งค่า"}
        </Link>
      ) : null}
    </div>
  );
}

/** section แสดงเมื่อยังไม่ได้กำหนดปีงบประมาณ */
export function BudgetNoActiveYear() {
  return (
    <section className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
      <p>ยังไม่ได้กำหนดปีงบประมาณ — ไปที่เมนูปีงบประมาณเพื่อตั้งค่าก่อน</p>
      <Link
        href="/modules/budget/years"
        className="mt-4 inline-block text-primary hover:underline"
      >
        กำหนดปีงบประมาณ
      </Link>
    </section>
  );
}
