import { redirect } from "next/navigation";
import { CarDriverForm } from "@/components/car/car-driver-form";
import { createCarDriver } from "@/lib/car/actions";
import { canManageCarSettings } from "@/lib/car/permissions";
import { requireCarScope } from "@/lib/car/scope";

export default async function CarDriverNewPage() {
  const { user, perms } = await requireCarScope();
  if (!canManageCarSettings(user, perms)) {
    redirect("/modules/car/requests");
  }

  return (
    <CarDriverForm
      action={createCarDriver}
      title="เพิ่มพนักงานขับรถ"
      cancelHref="/modules/car/drivers"
    />
  );
}
