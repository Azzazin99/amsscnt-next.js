import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  CommandForm,
  type CommandFormDefaults,
} from "@/components/bookregister/command/command-form";
import {
  canEditCommandRecord,
  canViewDistrictRegisters,
  canWriteDistrictRegisters,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { updateDistrictCommand } from "@/lib/bookregister/command/actions";
import { getDistrictCommand } from "@/lib/bookregister/command/queries";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditDistrictCommandPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canViewDistrictRegisters(session.user, perms)) {
    redirect("/modules/bookregister");
  }
  if (!canWriteDistrictRegisters(session.user, perms)) {
    redirect("/modules/bookregister/command");
  }

  const row = await getDistrictCommand(id);
  if (!row) notFound();

  if (
    !canEditCommandRecord(
      session.user,
      perms,
      row.officerId,
      row.registerDate,
    )
  ) {
    redirect("/modules/bookregister/command");
  }

  const defaults: CommandFormDefaults = {
    bookNo: row.bookNo ?? undefined,
    signdate: row.signdate ?? undefined,
    subject: row.subject ?? undefined,
    comment: row.comment ?? undefined,
    fileName: row.fileName,
    commandId: row.id,
  };

  const boundUpdate = updateDistrictCommand.bind(null, id);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <CommandForm
        title={`แก้ไขทะเบียนคำสั่ง เลขที่ ${row.registerNumber}/${row.year}`}
        cancelHref="/modules/bookregister/command"
        defaultValues={defaults}
        action={boundUpdate}
        mode="edit"
      />
    </section>
  );
}
