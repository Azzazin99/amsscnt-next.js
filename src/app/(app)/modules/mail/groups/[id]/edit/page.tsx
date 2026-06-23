import { notFound } from "next/navigation";
import { MailGroupForm } from "@/components/mail/mail-group-form";
import {
  deleteMailGroup,
  updateMailGroup,
} from "@/lib/mail/groups/actions";
import {
  getMailGroupById,
  listMailGroupMemberIds,
} from "@/lib/mail/groups/queries";
import { listActivePeopleForMailPicker } from "@/lib/mail/queries";
import { requireMailSettingsAccess } from "@/lib/mail/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function MailGroupEditPage({ params }: Props) {
  await requireMailSettingsAccess();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const group = await getMailGroupById(id);
  if (!group) notFound();

  const [people, memberIds] = await Promise.all([
    listActivePeopleForMailPicker(),
    listMailGroupMemberIds(id),
  ]);

  async function saveAction(formData: FormData) {
    "use server";
    return updateMailGroup(id, formData);
  }

  async function removeAction() {
    "use server";
    return deleteMailGroup(id);
  }

  return (
    <MailGroupForm
      action={saveAction}
      deleteAction={removeAction}
      title="แก้ไขกลุ่มบุคลากร"
      cancelHref="/modules/mail/groups"
      mode="edit"
      people={people}
      defaultValues={{
        name: group.name,
        sortOrder: group.sortOrder,
        personIds: memberIds,
      }}
    />
  );
}
