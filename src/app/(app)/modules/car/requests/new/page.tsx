import { redirect } from "next/navigation";
import { CarRequestForm } from "@/components/car/car-request-form";
import { createCarRequest } from "@/lib/car/actions";
import { canWriteCarRequest } from "@/lib/car/permissions";
import {
  listActiveDriversForPicker,
  listBookableVehicles,
} from "@/lib/car/queries";
import { requireCarScope } from "@/lib/car/scope";

export default async function CarRequestNewPage() {
  const { user, perms } = await requireCarScope();
  if (!canWriteCarRequest(user, perms)) {
    redirect("/modules/car/requests");
  }

  const [vehicles, drivers] = await Promise.all([
    listBookableVehicles(),
    listActiveDriversForPicker(),
  ]);

  return (
    <CarRequestForm
      action={createCarRequest}
      cancelHref="/modules/car/requests"
      vehicles={vehicles}
      drivers={drivers}
    />
  );
}
