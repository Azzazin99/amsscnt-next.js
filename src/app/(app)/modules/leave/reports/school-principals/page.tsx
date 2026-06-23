import { LeaveReportHeader } from "@/components/leave/reports/leave-report-header";
import { LeaveReportToolbar } from "@/components/leave/reports/leave-report-toolbar";
import { LeaveReportYearFilter } from "@/components/leave/reports/leave-report-year-filter";
import { LeaveSickPrivacyBirthTable } from "@/components/leave/reports/leave-sick-privacy-birth-table";
import {
  getLeaveReportOfficeName,
  resolveLeaveReportYear,
} from "@/lib/leave/reports/page-helpers";
import { listSchoolPrincipalStats } from "@/lib/leave/reports/queries";
import { requireDistrictLeaveReportPage } from "@/lib/leave/report-access";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function LeaveSchoolPrincipalsReportPage({
  searchParams,
}: Props) {
  const { reportScope } = await requireDistrictLeaveReportPage();
  const params = await searchParams;
  const { year, years } = await resolveLeaveReportYear(params.year);

  const rows = await listSchoolPrincipalStats(year);
  const officeName = await getLeaveReportOfficeName(reportScope);

  return (
    <div className="space-y-4">
      <LeaveReportToolbar
        rowCount={rows.length}
        subtitle={`ปีงบ ${year}`}
      />
      <LeaveReportYearFilter
        years={years}
        year={year}
        basePath="/modules/leave/reports/school-principals"
      />
      <LeaveReportHeader
        title="สถิติการลาป่วย ลากิจ ลาคลอด (ผอ.โรงเรียน)"
        officeName={officeName}
        subtitle={`ปีงบประมาณ ${year}`}
      />
      <LeaveSickPrivacyBirthTable rows={rows} showSchool />
    </div>
  );
}
