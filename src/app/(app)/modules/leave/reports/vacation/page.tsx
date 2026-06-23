import { redirect } from "next/navigation";
import { LeaveReportHeader } from "@/components/leave/reports/leave-report-header";
import { LeaveReportToolbar } from "@/components/leave/reports/leave-report-toolbar";
import { LeaveReportYearFilter } from "@/components/leave/reports/leave-report-year-filter";
import { LeaveVacationStatTable } from "@/components/leave/reports/leave-vacation-stat-table";
import {
  getLeaveReportOfficeName,
  resolveLeaveReportYear,
} from "@/lib/leave/reports/page-helpers";
import { listDistrictVacationStats } from "@/lib/leave/reports/queries";
import { requireLeaveScope } from "@/lib/leave/scope";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function LeaveVacationReportPage({ searchParams }: Props) {
  const { scope } = await requireLeaveScope();
  if (scope.kind !== "district") {
    redirect("/modules/leave/reports");
  }
  const params = await searchParams;
  const { year, years } = await resolveLeaveReportYear(params.year);

  const rows = await listDistrictVacationStats(year);
  const officeName = await getLeaveReportOfficeName(scope);

  return (
    <div className="space-y-4">
      <LeaveReportToolbar
        rowCount={rows.length}
        subtitle={`ปีงบ ${year}`}
      />
      <LeaveReportYearFilter
        years={years}
        year={year}
        basePath="/modules/leave/reports/vacation"
      />
      <LeaveReportHeader
        title="สถิติการลาพักผ่อน"
        officeName={officeName}
        subtitle={`ปีงบประมาณ ${year}`}
      />
      <LeaveVacationStatTable rows={rows} />
    </div>
  );
}
