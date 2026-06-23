import { notFound, redirect } from "next/navigation";
import { CarVehicleForm } from "@/components/car/car-vehicle-form";
import { updateCarVehicle } from "@/lib/car/actions";
import { canManageCarSettings } from "@/lib/car/permissions";
import { getCarVehicle, listCarTypes } from "@/lib/car/queries";
import { requireCarScope } from "@/lib/car/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CarVehicleEditPage({ params }: Props) {
  const { user, perms } = await requireCarScope();
  if (!canManageCarSettings(user, perms)) {
    redirect("/modules/car/requests");
  }

  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const [vehicle, types] = await Promise.all([
    getCarVehicle(id),
    listCarTypes(),
  ]);
  if (!vehicle) notFound();

  return (
    <CarVehicleForm
      action={updateCarVehicle.bind(null, id)}
      types={types}
      title="แก้ไขยานพาหนะ"
      cancelHref="/modules/car/vehicles"
      defaultValues={{
        carCode: vehicle.carCode,
        carTypeCode: vehicle.carTypeCode,
        carNumber: vehicle.carNumber,
        name: vehicle.name,
        status: vehicle.status,
        pic: vehicle.pic,
      }}
    />
  );
}
