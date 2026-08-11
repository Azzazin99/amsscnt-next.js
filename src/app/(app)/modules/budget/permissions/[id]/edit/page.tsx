import { notFound, redirect } from "next/navigation";
import { BudgetPermissionForm } from "@/components/budget/budget-permission-form";
import { canManageBudgetStaffPermissions } from "@/lib/budget/permissions";
import {
  getBudgetStaffPermission,
  listBudgetStaffPermissions,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { updateBudgetStaffPermission } from "@/lib/budget/settings-actions";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetPermissionEditPage({ params }: Props) {
  const { user } = await requireBudgetAccess();
  if (!canManageBudgetStaffPermissions(user)) redirect("/modules/budget");

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetStaffPermission(id);
  if (!row) notFound();

  const withNames = await listBudgetStaffPermissions();
  const display = withNames.find((r) => r.id === id);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        แก้ไขสิทธิ์ {display?.displayName || row.personId}
      </h2>
      <BudgetPermissionForm
        action={updateBudgetStaffPermission.bind(null, id)}
        lockedPersonName={display?.displayName || row.personId}
        cancelHref="/modules/budget/permissions"
        defaultValues={{
          p1: row.p1,
          p2: row.p2,
          p3: row.p3,
          p4: row.p4,
          p5: row.p5,
          p6: row.p6,
          p7: row.p7,
          p8: row.p8,
          p9: row.p9,
          p10: row.p10,
        }}
      />
    </section>
  );
}
