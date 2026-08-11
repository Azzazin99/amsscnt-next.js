import { notFound, redirect } from "next/navigation";
import { CabinetPermissionForm } from "@/components/cabinet/cabinet-permission-form";
import { updateCabinetPermission } from "@/lib/cabinet/actions";
import { canManageCabinetStaffPermissions, getCabinetPermissions } from "@/lib/cabinet/permissions";
import {
  getCabinetModulePermission,
  listStaffForCabinetPermissionPicker,
} from "@/lib/cabinet/queries";
import { requireCabinetScope } from "@/lib/cabinet/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CabinetPermissionEditPage({ params }: Props) {
  const { user } = await requireCabinetScope();
  const perms = await getCabinetPermissions(Number(user.id));
  if (!canManageCabinetStaffPermissions(user)) redirect("/modules/cabinet");

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const row = await getCabinetModulePermission(id);
  if (!row) notFound();

  const staffOptions = await listStaffForCabinetPermissionPicker(row.userId);

  return (
    <CabinetPermissionForm
      action={updateCabinetPermission.bind(null, id)}
      staffOptions={staffOptions}
      title="แก้ไขเจ้าหน้าที่"
      cancelHref="/modules/cabinet/permissions"
      defaultValues={{
        userId: row.userId,
        p1: row.p1 === 1,
        officerPersonId: row.officerPersonId,
      }}
      lockUser
    />
  );
}
