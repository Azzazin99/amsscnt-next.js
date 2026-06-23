import { LeaveReportHeader } from "@/components/leave/reports/leave-report-header";
import { LeaveReportToolbar } from "@/components/leave/reports/leave-report-toolbar";
import { LeaveReportYearFilter } from "@/components/leave/reports/leave-report-year-filter";
import { LeaveSickPrivacyBirthTable } from "@/components/leave/reports/leave-sick-privacy-birth-table";
import {
  getLeaveReportOfficeName,
  resolveLeaveReportYear,
} from "@/lib/leave/reports/page-helpers";
import { parseReportPeriod } from "@/lib/leave/reports/period";
import { listDistrictSickPrivacyBirthStats } from "@/lib/leave/reports/queries";
import { requireDistrictLeaveReportPage } from "@/lib/leave/report-access";

const PERIOD_LABELS = {
  full: "12 เดือน (ต.ค.–ก.ย.)",
  "first-half": "6 เดือนแรก (ต.ค.–มี.ค.)",
  "second-half": "6 เดือนหลัง (เม.ย.–ก.ย.)",
} as const;

type Props = {
  searchParams: Promise<{ year?: string; period?: string }>;
};

export default async function LeaveSickPrivacyBirthReportPage({
  searchParams,
}: Props) {
  const { reportScope } = await requireDistrictLeaveReportPage();
  const params = await searchParams;
  const { year, years } = await resolveLeaveReportYear(params.year);
  const period = parseReportPeriod(params.period);

  const rows = await listDistrictSickPrivacyBirthStats(year, period);
  const officeName = await getLeaveReportOfficeName(reportScope);

  return (
    <div className="space-y-4">
      <LeaveReportToolbar
        rowCount={rows.length}
        subtitle={`ปีงบ ${year} · ${PERIOD_LABELS[period]}`}
      />
      <LeaveReportYearFilter
        years={years}
        year={year}
        period={period}
        showPeriod
        basePath="/modules/leave/reports/sick-privacy-birth"
      />
      <LeaveReportHeader
        title="สถิติการลาป่วย ลากิจ ลาคลอด"
        officeName={officeName}
        subtitle={`ปีงบประมาณ ${year} · ${PERIOD_LABELS[period]}`}
      />
      <LeaveSickPrivacyBirthTable rows={rows} />
    </div>
  );
}
