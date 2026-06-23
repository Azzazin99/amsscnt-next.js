import { notFound, redirect } from "next/navigation";
import { CarTypeForm } from "@/components/car/car-type-form";
import { updateCarType } from "@/lib/car/actions";
import { canManageCarSettings } from "@/lib/car/permissions";
import { getCarType } from "@/lib/car/queries";
import { requireCarScope } from "@/lib/car/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CarTypeEditPage({ params }: Props) {
  const { user, perms } = await requireCarScope();
  if (!canManageCarSettings(user, perms)) {
    redirect("/modules/car/requests");
  }

  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const carType = await getCarType(id);
  if (!carType) notFound();

  return (
    <CarTypeForm
      action={updateCarType.bind(null, id)}
      title="แก้ไขประเภทยานพาหนะ"
      cancelHref="/modules/car/types"
      defaultValues={{ code: carType.code, name: carType.name }}
    />
  );
}
