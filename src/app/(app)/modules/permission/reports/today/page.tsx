import { formatThaiDate } from "@/lib/format/thai-date";
import { PermissionReportListTable } from "@/components/permission/reports/permission-report-list-table";
import { PermissionReportToolbar } from "@/components/permission/reports/permission-report-toolbar";
import { bangkokTodayIso } from "@/lib/book/dates";
import { getPermissionReportOfficeName } from "@/lib/permission/reports/page-helpers";
import { listPermissionOnDate } from "@/lib/permission/reports/queries";
import { requirePermissionScope } from "@/lib/permission/scope";

export default async function PermissionTodayReportPage() {
  const { user, scope } = await requirePermissionScope();
  const isoDate = bangkokTodayIso();

  const rows = await listPermissionOnDate(scope, user.personId, isoDate);
  const officeName = await getPermissionReportOfficeName(scope);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">ขออนุญาตฯวันนี้</h2>
      <p className="text-sm text-muted-foreground">{officeName}</p>

      <PermissionReportToolbar
        rowCount={rows.length}
        subtitle={formatThaiDate(isoDate)}
      />
      <PermissionReportListTable
        rows={rows}
        showSchool={scope.kind === "district"}
      />
    </div>
  );
}
