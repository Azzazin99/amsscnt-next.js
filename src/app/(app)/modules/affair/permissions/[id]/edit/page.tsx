import { notFound, redirect } from "next/navigation";
import { AffairPermissionForm } from "@/components/affair/affair-permission-form";
import { updateAffairPermission } from "@/lib/affair/actions";
import { canManageAffairSettings } from "@/lib/affair/permissions";
import {
  getAffairModulePermission,
  listStaffForAffairPermissionPicker,
} from "@/lib/affair/queries";
import { requireAffairScope } from "@/lib/affair/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AffairPermissionEditPage({ params }: Props) {
  const { user } = await requireAffairScope();
  if (!canManageAffairSettings(user)) redirect("/modules/affair");

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const row = await getAffairModulePermission(id);
  if (!row) notFound();

  const staffOptions = await listStaffForAffairPermissionPicker(row.userId);

  return (
    <AffairPermissionForm
      action={updateAffairPermission.bind(null, id)}
      staffOptions={staffOptions}
      title="แก้ไขเจ้าหน้าที่"
      cancelHref="/modules/affair/permissions"
      defaultValues={{
        userId: row.userId,
        p1: row.p1 === 1,
        officerPersonId: row.officerPersonId,
      }}
      lockUser
    />
  );
}
