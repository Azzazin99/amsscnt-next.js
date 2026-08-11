import Link from "next/link";
import { PlanEmptyState } from "@/components/plan/plan-empty-state";
import { PlanReportFilters } from "@/components/plan/plan-report-filters";
import { PlanReportNestedTable } from "@/components/plan/plan-report-nested-table";
import {
  listPlanReportProjects,
  listPlanStrategies,
  listPlanYears,
  listWorkgroupOptions,
  parsePlanReportSearchParams,
  resolvePlanReportYear,
} from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

type Props = {
  searchParams: Promise<{ year?: string; workgroup?: string }>;
};

export default async function AllocationSummaryPage({ searchParams }: Props) {
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

  const [years, workgroups, rows] = await Promise.all([
    listPlanYears(),
    listWorkgroupOptions(),
    listPlanReportProjects({
      budgetYear: yearRow.budgetYear,
      codeClus: parsed.codeClus,
      missingSourceLabel: "empty",
    }),
  ]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        รายงานการจัดสรรงบประมาณจำแนกตามโครงการ {yearRow.budgetYear}
      </h2>

      <PlanReportFilters
        basePath="/modules/plan/reports/allocation-summary"
        years={years}
        selectedYear={yearRow.budgetYear}
        workgroups={workgroups}
        selectedWorkgroup={parsed.codeClus}
        filterMode="workgroup"
      />

      {rows.length === 0 ? (
        <PlanEmptyState title="ยังไม่มีโครงการ" message="ยังไม่มีโครงการประจำปีสำหรับปีนี้" />
      ) : (
        <PlanReportNestedTable rows={rows} mode="allocation" />
      )}
    </section>
  );
}
