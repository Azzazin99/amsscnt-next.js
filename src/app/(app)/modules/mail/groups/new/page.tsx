import { redirect } from "next/navigation";
import { MailGroupForm } from "@/components/mail/mail-group-form";
import { createMailGroup } from "@/lib/mail/groups/actions";
import { listActivePeopleForMailPicker } from "@/lib/mail/queries";
import { requireMailSettingsAccess } from "@/lib/mail/scope";

export default async function MailGroupNewPage() {
  await requireMailSettingsAccess();
  const people = await listActivePeopleForMailPicker();

  return (
    <MailGroupForm
      action={createMailGroup}
      title="เพิ่มกลุ่มบุคลากร"
      cancelHref="/modules/mail/groups"
      mode="create"
      people={people}
    />
  );
}
