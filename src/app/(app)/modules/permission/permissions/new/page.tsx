import { PermissionModulePermissionForm } from "@/components/permission/permission-module-permission-form";
import { createPermissionModulePermission } from "@/lib/permission/actions";
import { listDistrictStaffForPermissionPicker } from "@/lib/permission/queries";

export default async function PermissionModulePermissionNewPage() {
  const staffOptions = await listDistrictStaffForPermissionPicker();

  return (
    <PermissionModulePermissionForm
      action={createPermissionModulePermission}
      staffOptions={staffOptions}
      title="เพิ่มสิทธิ์ขออนุญาตไปราชการ"
      cancelHref="/modules/permission/permissions"
    />
  );
}
