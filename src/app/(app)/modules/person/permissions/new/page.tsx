import { PersonModulePermissionForm } from "@/components/person/person-module-permission-form";
import { createPersonModulePermission } from "@/lib/person/permissions/actions";
import { listDistrictStaffForPersonPicker } from "@/lib/person/permissions/queries";

export default async function PersonPermissionNewPage() {
  const staffOptions = await listDistrictStaffForPersonPicker();

  return (
    <PersonModulePermissionForm
      action={createPersonModulePermission}
      staffOptions={staffOptions}
      title="เพิ่มสิทธิ์บุคลากร"
      cancelHref="/modules/person/permissions"
    />
  );
}
