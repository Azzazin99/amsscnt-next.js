import { ListPagination } from "@/components/core/list-pagination";
import { LeaveReportHeader } from "@/components/leave/reports/leave-report-header";
import { LeaveReportListTable } from "@/components/leave/reports/leave-report-list-table";
import { LeaveReportToolbar } from "@/components/leave/reports/leave-report-toolbar";
import { PAGE_SIZE } from "@/lib/leave/queries";
import { getLeaveReportOfficeName } from "@/lib/leave/reports/page-helpers";
import {
  countLeaveReportAll,
  listLeaveReportAllPage,
  resolveReportPage,
} from "@/lib/leave/reports/queries";
import { requireLeaveScope } from "@/lib/leave/scope";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function LeaveAllReportPage({ searchParams }: Props) {
  const { user, scope } = await requireLeaveScope();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const total = await countLeaveReportAll(scope, user.personId);
  const resolvedPage = await resolveReportPage(total, page);
  const rows = await listLeaveReportAllPage({
    scope,
    viewerPersonId: user.personId,
    page: resolvedPage,
  });
  const officeName = await getLeaveReportOfficeName(scope);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <LeaveReportToolbar rowCount={total} subtitle="ขออนุญาตลาทั้งหมด" />
      <LeaveReportHeader
        title="รายการลาทั้งหมด"
        officeName={officeName}
      />
      <LeaveReportListTable rows={rows} showSchool={scope.kind === "district"} />
      <div className="no-print">
        <ListPagination
          page={resolvedPage}
          totalPages={totalPages}
          basePath="/modules/leave/reports/all"
        />
      </div>
    </div>
  );
}
