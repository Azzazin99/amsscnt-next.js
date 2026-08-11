import { redirect } from "next/navigation";
import { CabinetPermissionForm } from "@/components/cabinet/cabinet-permission-form";
import { createCabinetPermission } from "@/lib/cabinet/actions";
import { canManageCabinetStaffPermissions, getCabinetPermissions } from "@/lib/cabinet/permissions";
import { listStaffForCabinetPermissionPicker } from "@/lib/cabinet/queries";
import { requireCabinetScope } from "@/lib/cabinet/scope";

export default async function CabinetPermissionNewPage() {
  const { user } = await requireCabinetScope();
  const perms = await getCabinetPermissions(Number(user.id));
  if (!canManageCabinetStaffPermissions(user)) redirect("/modules/cabinet");

  const staffOptions = await listStaffForCabinetPermissionPicker();

  return (
    <CabinetPermissionForm
      action={createCabinetPermission}
      staffOptions={staffOptions}
      title="เพิ่มเจ้าหน้าที่"
      cancelHref="/modules/cabinet/permissions"
    />
  );
}
