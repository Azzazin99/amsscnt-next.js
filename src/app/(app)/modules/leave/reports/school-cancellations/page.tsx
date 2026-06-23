import { redirect } from "next/navigation";
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
import { requireLeaveScope } from "@/lib/leave/scope";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function LeaveSchoolCancellationsReportPage({
  searchParams,
}: Props) {
  const { user, scope } = await requireLeaveScope();
  if (scope.kind !== "school") {
    redirect("/modules/leave/reports");
  }
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const total = await countCancellationReport(scope, user.personId);
  const resolvedPage = await resolveReportPage(total, page);
  const rows = await listCancellationReportPage({
    scope,
    viewerPersonId: user.personId,
    page: resolvedPage,
  });
  const officeName = await getLeaveReportOfficeName(scope);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <LeaveReportToolbar rowCount={total} subtitle="ขอยกเลิกวันลา (รร.)" />
      <LeaveReportHeader
        title="รายการยกเลิกวันลา"
        officeName={officeName}
        subtitle={scope.kind === "school" ? scope.schoolName : undefined}
      />
      <LeaveCancellationReportTable rows={rows} />
      <div className="no-print">
        <ListPagination
          page={resolvedPage}
          totalPages={totalPages}
          basePath="/modules/leave/reports/school-cancellations"
        />
      </div>
    </div>
  );
}
