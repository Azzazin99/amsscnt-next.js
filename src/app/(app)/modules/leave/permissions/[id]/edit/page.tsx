import { notFound } from "next/navigation";
import { LeavePermissionForm } from "@/components/leave/leave-permission-form";
import { updateLeavePermission } from "@/lib/leave/actions";
import {
  getLeaveModulePermission,
  listDistrictStaffForLeavePicker,
} from "@/lib/leave/queries";

type Props = { params: Promise<{ id: string }> };

export default async function LaPermissionEditPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const row = await getLeaveModulePermission(id);
  if (!row) notFound();

  const staffOptions = await listDistrictStaffForLeavePicker(row.userId);

  return (
    <LeavePermissionForm
      action={updateLeavePermission.bind(null, id)}
      staffOptions={staffOptions}
      title="แก้ไขสิทธิ์ระบบลา"
      cancelHref="/modules/leave/permissions"
      lockUser
      defaultValues={{
        userId: row.userId,
        p1: row.p1 === 1,
        p2: row.p2 === 1,
        officerPersonId: row.officerPersonId,
      }}
    />
  );
}
