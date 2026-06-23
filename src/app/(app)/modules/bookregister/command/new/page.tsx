import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  CommandForm,
  type CommandFormDefaults,
} from "@/components/bookregister/command/command-form";
import {
  canViewDistrictRegisters,
  canWriteDistrictRegisters,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { createDistrictCommand } from "@/lib/bookregister/command/actions";
import {
  allocateNextCommandNumber,
} from "@/lib/bookregister/command/queries";
import { getActiveDistrictYear } from "@/lib/bookregister/years/queries";

export default async function NewDistrictCommandPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canViewDistrictRegisters(session.user, perms)) {
    redirect("/modules/bookregister");
  }
  if (!canWriteDistrictRegisters(session.user, perms)) {
    redirect("/modules/bookregister/command");
  }

  const activeYear = await getActiveDistrictYear();
  const commandEnabled =
    activeYear != null && activeYear.startCommandNum > 0;
  if (!commandEnabled) {
    redirect("/modules/bookregister/command");
  }

  const nextNumber = await allocateNextCommandNumber(activeYear!.year);
  const defaults: CommandFormDefaults = {
    bookNo: `${nextNumber}/${activeYear!.year}`,
  };

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <CommandForm
        title="ลงทะเบียนคำสั่ง"
        cancelHref="/modules/bookregister/command"
        defaultValues={defaults}
        action={createDistrictCommand}
        mode="create"
      />
    </section>
  );
}
