import { ListPagination } from "@/components/core/list-pagination";
import { PermissionReportListTable } from "@/components/permission/reports/permission-report-list-table";
import { PermissionReportToolbar } from "@/components/permission/reports/permission-report-toolbar";
import { PAGE_SIZE } from "@/lib/permission/queries";
import { getPermissionReportOfficeName } from "@/lib/permission/reports/page-helpers";
import {
  countPermissionReportAll,
  listPermissionReportAllPage,
  resolveReportPage,
} from "@/lib/permission/reports/queries";
import { requirePermissionScope } from "@/lib/permission/scope";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function PermissionAllReportPage({ searchParams }: Props) {
  const { user, scope } = await requirePermissionScope();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const total = await countPermissionReportAll(scope, user.personId);
  const resolvedPage = await resolveReportPage(total, page);
  const rows = await listPermissionReportAllPage({
    scope,
    viewerPersonId: user.personId,
    page: resolvedPage,
  });
  const officeName = await getPermissionReportOfficeName(scope);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">ขออนุญาตฯทั้งหมด</h2>
      <p className="text-sm text-muted-foreground">{officeName}</p>

      <PermissionReportToolbar
        rowCount={total}
        subtitle="ขออนุญาตไปราชการทั้งหมด"
      />
      <PermissionReportListTable
        rows={rows}
        showSchool={scope.kind === "district"}
      />
      <div className="no-print">
        <ListPagination
          page={resolvedPage}
          totalPages={totalPages}
          basePath="/modules/permission/reports/all"
        />
      </div>
    </div>
  );
}
