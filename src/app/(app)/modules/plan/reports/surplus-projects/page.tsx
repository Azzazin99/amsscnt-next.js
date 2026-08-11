import Link from "next/link";
import { PlanEmptyState } from "@/components/plan/plan-empty-state";
import { PlanReportFilters } from "@/components/plan/plan-report-filters";
import { formatMoney } from "@/lib/budget/constants";
import {
  listPlanYears,
  listSurplusProjectReport,
  parsePlanReportSearchParams,
  resolvePlanReportYear,
} from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function SurplusProjectsReportPage({ searchParams }: Props) {
  await requirePlanAccess();
  const params = await searchParams;
  const parsed = parsePlanReportSearchParams(params);
  const yearRow = await resolvePlanReportYear(parsed.budgetYear);

  if (!yearRow) {
    return (
      <section className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>ยังไม่ได้กำหนดปีงบประมาณ — ไปที่เมนูปีงบประมาณเพื่อตั้งค่าก่อน</p>
        <Link href="/modules/plan/years" className="mt-4 inline-block text-primary hover:underline">
          กำหนดปีงบประมาณ
        </Link>
      </section>
    );
  }

  const [years, rows] = await Promise.all([
    listPlanYears(),
    listSurplusProjectReport(yearRow.budgetYear),
  ]);
  const total = rows.reduce((s, r) => s + (r.budgetProj ?? 0), 0);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          โครงการเพิ่มเติมจากเงินเหลือจ่าย {yearRow.budgetYear}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          รวมงบ {formatMoney(total)} บาท
        </p>
      </div>

      <PlanReportFilters
        basePath="/modules/plan/reports/surplus-projects"
        years={years}
        selectedYear={yearRow.budgetYear}
        filterMode="year"
      />

      {rows.length === 0 ? (
        <PlanEmptyState
          title="ยังไม่มีโครงการเงินเหลือจ่าย"
          message="ยังไม่มีโครงการจากเงินเหลือจ่ายสำหรับปีนี้"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-3 font-medium">ที่</th>
                <th className="px-3 py-3 font-medium">รหัส</th>
                <th className="px-3 py-3 font-medium">ชื่อโครงการ</th>
                <th className="px-3 py-3 font-medium">หัวหน้าโครงการ</th>
                <th className="px-3 py-3 text-right font-medium">งบจัดสรร</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5 text-center">{i + 1}</td>
                  <td className="px-3 py-2.5 font-mono">{row.codeProj}</td>
                  <td className="px-3 py-2.5">{row.nameProj}</td>
                  <td className="px-3 py-2.5">{row.ownerName || "—"}</td>
                  <td className="px-3 py-2.5 text-right">{formatMoney(row.budgetProj)}</td>
                </tr>
              ))}
              <tr className="border-t bg-muted/50 font-medium">
                <td className="px-3 py-2.5 text-center" colSpan={4}>
                  รวม
                </td>
                <td className="px-3 py-2.5 text-right">{formatMoney(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
