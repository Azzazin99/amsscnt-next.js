import { notFound } from "next/navigation";
import { PersonModulePermissionForm } from "@/components/person/person-module-permission-form";
import { updatePersonModulePermission } from "@/lib/person/permissions/actions";
import {
  getPersonModulePermission,
  listDistrictStaffForPersonPicker,
} from "@/lib/person/permissions/queries";

type Props = { params: Promise<{ id: string }> };

export default async function PersonPermissionEditPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const row = await getPersonModulePermission(id);
  if (!row) notFound();

  const staffOptions = await listDistrictStaffForPersonPicker(row.userId);

  return (
    <PersonModulePermissionForm
      action={updatePersonModulePermission.bind(null, id)}
      staffOptions={staffOptions}
      title="แก้ไขสิทธิ์บุคลากร"
      cancelHref="/modules/person/permissions"
      lockUser
      defaultValues={{
        userId: row.userId,
        p1: row.p1 === 1,
        p2: row.p2 === 1,
        p3: row.p3 === 1,
      }}
    />
  );
}
