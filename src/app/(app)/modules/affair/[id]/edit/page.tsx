import { notFound, redirect } from "next/navigation";
import { AffairForm } from "@/components/affair/affair-form";
import { updateAffairEntry } from "@/lib/affair/actions";
import {
  canWriteAffair,
  getAffairPermissions,
} from "@/lib/affair/permissions";
import {
  getAffairEntry,
  listActivePeopleForAffairPicker,
} from "@/lib/affair/queries";
import { requireAffairScope } from "@/lib/affair/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AffairEditPage({ params }: Props) {
  const { user } = await requireAffairScope();
  const perms = await getAffairPermissions(Number(user.id));
  if (!canWriteAffair(user, perms)) redirect("/modules/affair");

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const entry = await getAffairEntry(id);
  if (!entry) notFound();

  const people = await listActivePeopleForAffairPicker();

  return (
    <AffairForm
      action={updateAffairEntry.bind(null, id)}
      people={people}
      title="แก้ไขภารกิจผู้อำนวยการ"
      cancelHref="/modules/affair"
      defaultValues={{
        affairDate: entry.affairDate,
        affairTime: entry.affairTime,
        subject: entry.subject,
        location: entry.location,
        operationPersonId: entry.operationPersonId,
        remark: entry.remark,
      }}
    />
  );
}
