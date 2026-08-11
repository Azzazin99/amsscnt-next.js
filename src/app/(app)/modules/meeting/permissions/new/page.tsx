import { redirect } from "next/navigation";
import { MeetingPermissionForm } from "@/components/meeting/meeting-permission-form";
import { createMeetingPermission } from "@/lib/meeting/actions";
import { canManageMeetingStaffPermissions } from "@/lib/meeting/permissions";
import { listDistrictStaffForMeetingPicker } from "@/lib/meeting/queries";
import { requireMeetingScope } from "@/lib/meeting/scope";

export default async function MeetingPermissionNewPage() {
  const { user } = await requireMeetingScope();
  if (!canManageMeetingStaffPermissions(user)) {
    redirect("/modules/meeting/bookings");
  }

  const staffOptions = await listDistrictStaffForMeetingPicker();

  return (
    <MeetingPermissionForm
      action={createMeetingPermission}
      staffOptions={staffOptions}
      title="เพิ่มสิทธิ์เจ้าหน้าที่"
      cancelHref="/modules/meeting/permissions"
    />
  );
}
