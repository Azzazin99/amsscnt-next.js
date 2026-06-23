import { ListPagination } from "@/components/core/list-pagination";
import { LeaveCancellationReportTable } from "@/components/leave/reports/leave-cancellation-report-table";
import { LeaveReportHeader } from "@/components/leave/reports/leave-report-header";
import { LeaveReportToolbar } from "@/components/leave/reports/leave-report-toolbar";
import { PAGE_SIZE } from "@/lib/leave/queries";
import { getLeaveReportOfficeName } from "@/lib/leave/reports/page-helpers";
import {
  countCancellationReport,
  listCancellationReportPage,
  resolveReportPage,
} from "@/lib/leave/reports/queries";
import { requireDistrictLeaveReportPage } from "@/lib/leave/report-access";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function LeaveCancellationsReportPage({
  searchParams,
}: Props) {
  const { user, reportScope } = await requireDistrictLeaveReportPage();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const total = await countCancellationReport(reportScope, user.personId);
  const resolvedPage = await resolveReportPage(total, page);
  const rows = await listCancellationReportPage({
    scope: reportScope,
    viewerPersonId: user.personId,
    page: resolvedPage,
  });
  const officeName = await getLeaveReportOfficeName(reportScope);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <LeaveReportToolbar rowCount={total} subtitle="ขอยกเลิกวันลาทั้งหมด" />
      <LeaveReportHeader
        title="รายการยกเลิกวันลาทั้งหมด"
        officeName={officeName}
      />
      <LeaveCancellationReportTable rows={rows} />
      <div className="no-print">
        <ListPagination
          page={resolvedPage}
          totalPages={totalPages}
          basePath="/modules/leave/reports/cancellations"
        />
      </div>
    </div>
  );
}
