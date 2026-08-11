import { redirect } from "next/navigation";
import { BudgetPermissionForm } from "@/components/budget/budget-permission-form";
import { canManageBudgetStaffPermissions } from "@/lib/budget/permissions";
import { listPersonOptions } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { createBudgetStaffPermission } from "@/lib/budget/settings-actions";

export default async function BudgetPermissionNewPage() {
  const { user } = await requireBudgetAccess();
  if (!canManageBudgetStaffPermissions(user)) redirect("/modules/budget");

  const people = await listPersonOptions();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-primary">
        เพิ่มเจ้าหน้าที่การเงินและบัญชี
      </h2>
      <BudgetPermissionForm
        action={createBudgetStaffPermission}
        people={people}
        cancelHref="/modules/budget/permissions"
      />
    </section>
  );
}
