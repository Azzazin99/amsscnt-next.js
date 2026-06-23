import { redirect } from "next/navigation";
import { LeaveReportHeader } from "@/components/leave/reports/leave-report-header";
import { LeaveReportToolbar } from "@/components/leave/reports/leave-report-toolbar";
import { LeaveReportYearFilter } from "@/components/leave/reports/leave-report-year-filter";
import { LeaveSickPrivacyBirthTable } from "@/components/leave/reports/leave-sick-privacy-birth-table";
import {
  getLeaveReportOfficeName,
  resolveLeaveReportYear,
} from "@/lib/leave/reports/page-helpers";
import { listSchoolStaffStats } from "@/lib/leave/reports/queries";
import { requireLeaveScope } from "@/lib/leave/scope";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function LeaveSchoolStaffReportPage({
  searchParams,
}: Props) {
  const { scope } = await requireLeaveScope();
  if (scope.kind !== "school") {
    redirect("/modules/leave/reports");
  }

  const params = await searchParams;
  const { year, years } = await resolveLeaveReportYear(params.year);

  const rows = await listSchoolStaffStats(scope, year);
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
        basePath="/modules/leave/reports/school-staff"
      />
      <LeaveReportHeader
        title="สถิติการลาป่วย ลากิจ ลาคลอด"
        officeName={officeName}
        subtitle={`ปีงบประมาณ ${year} · ${scope.schoolName}`}
      />
      <LeaveSickPrivacyBirthTable rows={rows} />
    </div>
  );
}
