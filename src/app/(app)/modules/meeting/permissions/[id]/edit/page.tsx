import { notFound, redirect } from "next/navigation";
import { MeetingPermissionForm } from "@/components/meeting/meeting-permission-form";
import { updateMeetingPermission } from "@/lib/meeting/actions";
import { canManageMeetingStaffPermissions } from "@/lib/meeting/permissions";
import {
  getMeetingModulePermission,
  listDistrictStaffForMeetingPicker,
} from "@/lib/meeting/queries";
import { requireMeetingScope } from "@/lib/meeting/scope";

type Props = { params: Promise<{ id: string }> };

export default async function MeetingPermissionEditPage({ params }: Props) {
  const { user } = await requireMeetingScope();
  if (!canManageMeetingStaffPermissions(user)) {
    redirect("/modules/meeting/bookings");
  }

  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const row = await getMeetingModulePermission(id);
  if (!row) notFound();

  const staffOptions = await listDistrictStaffForMeetingPicker(row.userId);

  return (
    <MeetingPermissionForm
      action={updateMeetingPermission.bind(null, id)}
      staffOptions={staffOptions}
      title="แก้ไขสิทธิ์เจ้าหน้าที่"
      cancelHref="/modules/meeting/permissions"
      lockUser
      defaultValues={{
        userId: row.userId,
        p1: row.p1 === 1,
        officerPersonId: row.officerPersonId,
      }}
    />
  );
}
