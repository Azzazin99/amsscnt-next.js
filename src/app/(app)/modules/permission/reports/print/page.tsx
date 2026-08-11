import { PermissionReportListTable } from "@/components/permission/reports/permission-report-list-table";
import { PermissionReportToolbar } from "@/components/permission/reports/permission-report-toolbar";
import { getPermissionReportOfficeName } from "@/lib/permission/reports/page-helpers";
import { listPermissionForPrint } from "@/lib/permission/reports/queries";
import { requirePermissionScope } from "@/lib/permission/scope";

export default async function PermissionPrintReportPage() {
  const { user, scope } = await requirePermissionScope();

  const rows = await listPermissionForPrint({ personId: user.personId });
  const officeName = await getPermissionReportOfficeName(scope);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-primary print:text-base">
        พิมพ์การขออนุญาตไปราชการ
      </h2>
      <p className="text-sm text-muted-foreground print:text-black">
        {officeName}
      </p>

      <PermissionReportToolbar rowCount={rows.length} />
      <PermissionReportListTable
        rows={rows}
        showSchool={false}
        linkToDetail={false}
      />
    </div>
  );
}
