import { LeavePermissionForm } from "@/components/leave/leave-permission-form";
import { createLeavePermission } from "@/lib/leave/actions";
import { listDistrictStaffForLeavePicker } from "@/lib/leave/queries";

export default async function LaPermissionNewPage() {
  const staffOptions = await listDistrictStaffForLeavePicker();

  return (
    <LeavePermissionForm
      action={createLeavePermission}
      staffOptions={staffOptions}
      title="เพิ่มเจ้าหน้าที่"
      cancelHref="/modules/leave/permissions"
    />
  );
}
