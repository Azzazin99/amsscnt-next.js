import Link from "next/link";
import { PermissionReportListTable } from "@/components/permission/reports/permission-report-list-table";
import type { PermissionReportListRow } from "@/lib/permission/reports/queries";
import type { PermissionScope } from "@/lib/permission/scope";
import { scopeLabel } from "@/lib/permission/scope";

type PermissionOrgTravelReferenceTableProps = {
  rows: PermissionReportListRow[];
  scope: PermissionScope;
  budgetYearLabel?: string | null;
};

export function PermissionOrgTravelReferenceTable({
  rows,
  scope,
  budgetYearLabel,
}: PermissionOrgTravelReferenceTableProps) {
  const unitLabel = scopeLabel(scope);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-primary">
            สรุปการขอไปราชการในหน่วยงาน (อ้างอิง)
          </h3>
          <p className="text-sm text-muted-foreground">
            {unitLabel}
            {budgetYearLabel
              ? ` — ปีงบประมาณ ${budgetYearLabel}`
              : ""}
            {" · "}
            แสดงคำขอไปราชการของบุคลากรในหน่วยงานเพื่ออ้างอิงขณะยื่นคำขอ
          </p>
        </div>
        <Link
          href="/modules/permission/reports/all"
          className="text-sm text-primary hover:underline"
        >
          ดูรายงานทั้งหมด →
        </Link>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <PermissionReportListTable
          rows={rows}
          showSchool={scope.kind === "district"}
          linkToDetail={false}
        />
      </div>
    </section>
  );
}
