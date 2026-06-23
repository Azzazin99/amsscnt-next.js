import { notFound, redirect } from "next/navigation";
import { CarDriverForm } from "@/components/car/car-driver-form";
import { updateCarDriver } from "@/lib/car/actions";
import { canManageCarSettings } from "@/lib/car/permissions";
import { getCarDriver } from "@/lib/car/queries";
import { requireCarScope } from "@/lib/car/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CarDriverEditPage({ params }: Props) {
  const { user, perms } = await requireCarScope();
  if (!canManageCarSettings(user, perms)) {
    redirect("/modules/car/requests");
  }

  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const driver = await getCarDriver(id);
  if (!driver) notFound();

  return (
    <CarDriverForm
      action={updateCarDriver.bind(null, id)}
      title="แก้ไขพนักงานขับรถ"
      cancelHref="/modules/car/drivers"
      defaultValues={{
        personId: driver.personId,
        status: driver.status,
      }}
    />
  );
}
