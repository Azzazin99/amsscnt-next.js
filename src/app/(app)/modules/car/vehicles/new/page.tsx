import { redirect } from "next/navigation";
import { CarVehicleForm } from "@/components/car/car-vehicle-form";
import { createCarVehicle } from "@/lib/car/actions";
import { canManageCarSettings } from "@/lib/car/permissions";
import { listCarTypes } from "@/lib/car/queries";
import { requireCarScope } from "@/lib/car/scope";

export default async function CarVehicleNewPage() {
  const { user, perms } = await requireCarScope();
  if (!canManageCarSettings(user, perms)) {
    redirect("/modules/car/requests");
  }

  const types = await listCarTypes();

  return (
    <CarVehicleForm
      action={createCarVehicle}
      types={types}
      title="เพิ่มยานพาหนะ"
      cancelHref="/modules/car/vehicles"
    />
  );
}
