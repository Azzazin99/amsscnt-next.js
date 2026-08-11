import Link from "next/link";
import { PlanEmptyState } from "@/components/plan/plan-empty-state";
import { PlanReportFilters } from "@/components/plan/plan-report-filters";
import { PlanReportNestedTable } from "@/components/plan/plan-report-nested-table";
import {
  listPlanReportProjects,
  listPlanStrategies,
  listPlanYears,
  parsePlanReportSearchParams,
  resolvePlanReportYear,
} from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

type Props = {
  searchParams: Promise<{ year?: string; strategy?: string }>;
};

export default async function ProjectsByStrategyPage({ searchParams }: Props) {
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

  const [years, strategies, rows] = await Promise.all([
    listPlanYears(),
    listPlanStrategies(yearRow.budgetYear),
    listPlanReportProjects({
      budgetYear: yearRow.budgetYear,
      codeTegy: parsed.codeTegy,
    }),
  ]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        โครงการจำแนกตามกลยุทธ์ {yearRow.budgetYear}
      </h2>

      <PlanReportFilters
        basePath="/modules/plan/reports/by-strategy"
        years={years}
        selectedYear={yearRow.budgetYear}
        strategies={strategies}
        selectedStrategy={parsed.codeTegy}
        filterMode="strategy"
      />

      {rows.length === 0 ? (
        <PlanEmptyState title="ยังไม่มีโครงการ" message="ยังไม่มีโครงการประจำปีสำหรับปีนี้" />
      ) : (
        <PlanReportNestedTable rows={rows} mode="strategy" />
      )}
    </section>
  );
}
