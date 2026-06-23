import { notFound } from "next/navigation";
import { PermissionModulePermissionForm } from "@/components/permission/permission-module-permission-form";
import { updatePermissionModulePermission } from "@/lib/permission/actions";
import {
  getPermissionModulePermission,
  listDistrictStaffForPermissionPicker,
} from "@/lib/permission/queries";

type Props = { params: Promise<{ id: string }> };

export default async function PermissionModulePermissionEditPage({
  params,
}: Props) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const row = await getPermissionModulePermission(id);
  if (!row) notFound();

  const staffOptions = await listDistrictStaffForPermissionPicker(row.userId);

  return (
    <PermissionModulePermissionForm
      action={updatePermissionModulePermission.bind(null, id)}
      staffOptions={staffOptions}
      title="แก้ไขสิทธิ์ขออนุญาตไปราชการ"
      cancelHref="/modules/permission/permissions"
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
