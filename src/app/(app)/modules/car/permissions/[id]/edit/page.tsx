import { notFound, redirect } from "next/navigation";
import { CarPermissionForm } from "@/components/car/car-permission-form";
import { updateCarPermission } from "@/lib/car/actions";
import { canManageCarSettings } from "@/lib/car/permissions";
import {
  getCarModulePermission,
  listDistrictStaffForCarPicker,
} from "@/lib/car/queries";
import { requireCarScope } from "@/lib/car/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CarPermissionEditPage({ params }: Props) {
  const { user, perms } = await requireCarScope();
  if (!canManageCarSettings(user, perms)) {
    redirect("/modules/car/requests");
  }

  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const row = await getCarModulePermission(id);
  if (!row) notFound();

  const staffOptions = await listDistrictStaffForCarPicker(row.userId);

  return (
    <CarPermissionForm
      action={updateCarPermission.bind(null, id)}
      staffOptions={staffOptions}
      title="แก้ไขสิทธิ์การใช้งาน"
      cancelHref="/modules/car/permissions"
      defaultValues={{
        userId: row.userId,
        p1: row.p1,
        officerPersonId: row.officerPersonId,
      }}
      lockUser
    />
  );
}
