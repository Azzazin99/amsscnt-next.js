import { redirect } from "next/navigation";
import { CarTypeForm } from "@/components/car/car-type-form";
import { createCarType } from "@/lib/car/actions";
import { canManageCarSettings } from "@/lib/car/permissions";
import { requireCarScope } from "@/lib/car/scope";

export default async function CarTypeNewPage() {
  const { user, perms } = await requireCarScope();
  if (!canManageCarSettings(user, perms)) {
    redirect("/modules/car/requests");
  }

  return (
    <CarTypeForm
      action={createCarType}
      title="เพิ่มประเภทยานพาหนะ"
      cancelHref="/modules/car/types"
    />
  );
}
