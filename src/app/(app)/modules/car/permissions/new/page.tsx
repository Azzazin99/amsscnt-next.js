import { redirect } from "next/navigation";
import { CarPermissionForm } from "@/components/car/car-permission-form";
import { createCarPermission } from "@/lib/car/actions";
import { canManageCarSettings } from "@/lib/car/permissions";
import { listDistrictStaffForCarPicker } from "@/lib/car/queries";
import { requireCarScope } from "@/lib/car/scope";

export default async function CarPermissionNewPage() {
  const { user, perms } = await requireCarScope();
  if (!canManageCarSettings(user, perms)) {
    redirect("/modules/car/requests");
  }

  const staffOptions = await listDistrictStaffForCarPicker();

  return (
    <CarPermissionForm
      action={createCarPermission}
      staffOptions={staffOptions}
      title="เพิ่มสิทธิ์การใช้งาน"
      cancelHref="/modules/car/permissions"
    />
  );
}
