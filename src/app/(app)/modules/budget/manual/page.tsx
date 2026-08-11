import { requireBudgetAccess } from "@/lib/budget/scope";

export default async function BudgetManualPage() {
  await requireBudgetAccess();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">คู่มือการใช้งานระบบงบประมาณ</h2>
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        คู่มือการใช้งานอยู่ระหว่างการจัดทำ เร็ว ๆ นี้
      </div>
    </section>
  );
}
