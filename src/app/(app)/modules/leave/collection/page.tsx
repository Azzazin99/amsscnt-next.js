import Link from "next/link";
import { redirect } from "next/navigation";
import { LeaveCollectionTable } from "@/components/leave/leave-collection-table";
import { listLeaveCollectRows } from "@/lib/leave/collection-queries";
import { canManageLeaveSettings } from "@/lib/leave/permissions";
import { getActiveLeaveYear } from "@/lib/leave/queries";
import { requireLeaveScope } from "@/lib/leave/scope";

export default async function LeaveCollectionPage() {
  const { user, perms } = await requireLeaveScope();
  if (!canManageLeaveSettings(user, perms)) {
    redirect("/modules/leave/requests");
  }

  const activeYear = await getActiveLeaveYear();
  if (!activeYear) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-primary">วันลาสะสม</h2>
        <p className="text-sm text-muted-foreground">
          ยังไม่ได้กำหนดปีงบประมาณปัจจุบัน — ไปที่{" "}
          <Link
            href="/modules/leave/years"
            className="text-primary underline-offset-4 hover:underline"
          >
            กำหนดปีงบประมาณ
          </Link>{" "}
          ก่อน
        </p>
      </section>
    );
  }

  const rows = await listLeaveCollectRows(activeYear.budgetYear);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">วันลาสะสม</h2>
      <LeaveCollectionTable rows={rows} budgetYear={activeYear.budgetYear} />
    </section>
  );
}
