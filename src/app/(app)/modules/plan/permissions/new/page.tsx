import Link from "next/link";
import { redirect } from "next/navigation";
import { PlanPermissionForm } from "@/components/plan/plan-permission-form";
import { createPlanStaffPermission } from "@/lib/plan/settings-actions";
import { canManagePlanStaffPermissions } from "@/lib/plan/permissions";
import { listPersonOptions } from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

export default async function PlanPermissionNewPage() {
  const { user } = await requirePlanAccess();
  if (!canManagePlanStaffPermissions(user)) redirect("/modules/plan/projects");

  const people = await listPersonOptions();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">เพิ่มเจ้าหน้าที่แผนงาน</h2>
      <PlanPermissionForm
        action={createPlanStaffPermission}
        people={people}
        cancelHref="/modules/plan/permissions"
      />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/modules/plan/permissions" className="text-primary hover:underline">
          กลับรายการเจ้าหน้าที่
        </Link>
      </p>
    </section>
  );
}
