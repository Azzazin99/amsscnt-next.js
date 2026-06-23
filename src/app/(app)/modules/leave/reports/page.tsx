import Link from "next/link";
import { LeaveReportPicker } from "@/components/leave/reports/leave-report-picker";
import {
  getActiveLeaveYear,
  listLeaveYears,
} from "@/lib/leave/queries";
import { requireLeaveScope } from "@/lib/leave/scope";
import { resolveSchoolPrincipalReportViewer } from "@/lib/leave/report-access";

export default async function LeaveReportsHubPage() {
  const { user, scope } = await requireLeaveScope();
  const isPrincipalViewer = await resolveSchoolPrincipalReportViewer(
    user.personId,
    scope,
  );

  const [years, activeYear] = await Promise.all([
    listLeaveYears(),
    getActiveLeaveYear(),
  ]);

  const yearValues = years.map((y) => y.budgetYear);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">รายงาน</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          รายการลาและสถิติการลาตามระบบเดิม — พิมพ์หรือบันทึก PDF ได้จากหน้ารายงาน
        </p>
      </div>

      {yearValues.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          ยังไม่มีปีงบประมาณ — กรุณา{" "}
          <Link
            href="/modules/leave/years"
            className="text-primary underline-offset-4 hover:underline"
          >
            กำหนดปีงบประมาณ
          </Link>{" "}
          ก่อนเปิดรายงานสถิติ
        </p>
      ) : null}

      <LeaveReportPicker
        years={yearValues}
        defaultYear={activeYear?.budgetYear ?? null}
        scopeKind={scope.kind}
        isPrincipalViewer={isPrincipalViewer}
      />
    </div>
  );
}
