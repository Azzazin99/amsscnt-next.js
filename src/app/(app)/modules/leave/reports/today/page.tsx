import { formatThaiDate } from "@/lib/format/thai-date";
import { LeaveReportHeader } from "@/components/leave/reports/leave-report-header";
import { LeaveReportListTable } from "@/components/leave/reports/leave-report-list-table";
import { LeaveReportTodayFilter } from "@/components/leave/reports/leave-report-today-filter";
import { LeaveReportToolbar } from "@/components/leave/reports/leave-report-toolbar";
import { getLeaveReportOfficeName } from "@/lib/leave/reports/page-helpers";
import { listLeaveOnDate } from "@/lib/leave/reports/queries";
import { requireLeaveScope } from "@/lib/leave/scope";

type Props = {
  searchParams: Promise<{ date?: string }>;
};

function parseIsoDate(raw: string | undefined): string {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return new Date().toISOString().slice(0, 10);
}

export default async function LeaveTodayReportPage({ searchParams }: Props) {
  const { user, scope } = await requireLeaveScope();
  const params = await searchParams;
  const isoDate = parseIsoDate(params.date);

  const rows = await listLeaveOnDate(scope, user.personId, isoDate);
  const officeName = await getLeaveReportOfficeName(scope);

  return (
    <div className="space-y-4">
      <LeaveReportToolbar
        rowCount={rows.length}
        subtitle={formatThaiDate(isoDate)}
      />
      <LeaveReportTodayFilter
        defaultDate={isoDate}
        basePath="/modules/leave/reports/today"
      />
      <LeaveReportHeader
        title="รายการลาวันนี้"
        officeName={officeName}
        subtitle={formatThaiDate(isoDate)}
      />
      <LeaveReportListTable rows={rows} showSchool={scope.kind === "district"} />
    </div>
  );
}
