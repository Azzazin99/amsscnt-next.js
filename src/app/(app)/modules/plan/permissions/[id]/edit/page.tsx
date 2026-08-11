import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PlanPermissionForm } from "@/components/plan/plan-permission-form";
import { updatePlanStaffPermission } from "@/lib/plan/settings-actions";
import { canManagePlanStaffPermissions } from "@/lib/plan/permissions";
import { listPlanStaffPermissions } from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";

type Props = { params: Promise<{ id: string }> };

export default async function PlanPermissionEditPage({ params }: Props) {
  const { user } = await requirePlanAccess();
  if (!canManagePlanStaffPermissions(user)) redirect("/modules/plan/projects");

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const rows = await listPlanStaffPermissions();
  const row = rows.find((r) => r.id === id);
  if (!row) notFound();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        แก้ไขสิทธิ์ {row.displayName || row.personId}
      </h2>
      <PlanPermissionForm
        action={updatePlanStaffPermission.bind(null, id)}
        lockedPersonName={row.displayName || row.personId}
        cancelHref="/modules/plan/permissions"
        defaultValues={{
          permAdd: row.permAdd,
          permEdit: row.permEdit,
          permDele: row.permDele,
        }}
      />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/modules/plan/permissions" className="text-primary hover:underline">
          กลับรายการเจ้าหน้าที่
        </Link>
      </p>
    </section>
  );
}
