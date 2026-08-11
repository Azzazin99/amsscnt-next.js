import { redirect } from "next/navigation";
import { AffairPermissionForm } from "@/components/affair/affair-permission-form";
import { createAffairPermission } from "@/lib/affair/actions";
import { canManageAffairStaffPermissions } from "@/lib/affair/permissions";
import { listStaffForAffairPermissionPicker } from "@/lib/affair/queries";
import { requireAffairScope } from "@/lib/affair/scope";

export default async function AffairPermissionNewPage() {
  const { user } = await requireAffairScope();
  if (!canManageAffairStaffPermissions(user)) redirect("/modules/affair");

  const staffOptions = await listStaffForAffairPermissionPicker();

  return (
    <AffairPermissionForm
      action={createAffairPermission}
      staffOptions={staffOptions}
      title="เพิ่มเจ้าหน้าที่"
      cancelHref="/modules/affair/permissions"
    />
  );
}
