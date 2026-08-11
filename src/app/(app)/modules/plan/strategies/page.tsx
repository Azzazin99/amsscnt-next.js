import Link from "next/link";
import { redirect } from "next/navigation";
import { PlanStrategyForm } from "@/components/plan/plan-strategy-form";
import {
  createPlanStrategy,
  deletePlanStrategy,
} from "@/lib/plan/settings-actions";
import { canManagePlanStaffPermissions } from "@/lib/plan/permissions";
import { getActivePlanYear, listPlanStrategies } from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

export default async function PlanStrategiesPage() {
  const { user } = await requirePlanAccess();
  if (!canManagePlanStaffPermissions(user)) redirect("/modules/plan/projects");

  const activeYear = await getActivePlanYear();
  if (!activeYear) {
    return (
      <section className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>ยังไม่ได้กำหนดปีงบประมาณ — ไปที่เมนูปีงบประมาณเพื่อตั้งค่าก่อน</p>
        <Link href="/modules/plan/years" className="mt-4 inline-block text-primary hover:underline">
          กำหนดปีงบประมาณ
        </Link>
      </section>
    );
  }

  const rows = await listPlanStrategies(activeYear.budgetYear);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        กำหนดยุทธศาสตร์ ปีงบประมาณ {activeYear.budgetYear}
      </h2>

      <PlanStrategyForm action={createPlanStrategy} />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">รหัส</th>
              <th className="px-3 py-3 font-medium">ชื่อยุทธศาสตร์</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">
                  ยังไม่มียุทธศาสตร์
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                async function handleDelete() {
                  "use server";
                  await deletePlanStrategy(row.id);
                }
                return (
                  <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                    <td className="px-3 py-2.5 font-mono">{row.idTegic}</td>
                    <td className="px-3 py-2.5">{row.strategic}</td>
                    <td className="px-3 py-2.5 text-center">
                      <form action={handleDelete}>
                        <button type="submit" className="text-destructive hover:underline">
                          ลบ
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
