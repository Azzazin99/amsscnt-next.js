import { redirect } from "next/navigation";
import { IdocumentForm } from "@/components/idocument/idocument-form";
import { createIdocument } from "@/lib/idocument/actions";
import {
  getDefaultWorkgroupForPerson,
  listRecipientOptions,
  listWorkgroupOptions,
} from "@/lib/idocument/queries";
import { requireIdocumentScope } from "@/lib/idocument/scope";

export default async function IdocumentNewPage() {
  const { user, canWrite } = await requireIdocumentScope();
  if (!canWrite) redirect("/modules/idocument");

  const [workgroups, recipients, defaultWorkgroup] = await Promise.all([
    listWorkgroupOptions(),
    listRecipientOptions(),
    getDefaultWorkgroupForPerson(user.personId),
  ]);

  const defaultBookTo = user.officeName
    ? `ผู้อำนวยการ${user.officeName}`
    : "";

  return (
    <IdocumentForm
      title="เพิ่มบันทึกเสนอ"
      cancelHref="/modules/idocument"
      action={createIdocument}
      workgroups={workgroups}
      recipients={recipients}
      defaultBookTo={defaultBookTo}
      defaultValues={{
        workgroup: defaultWorkgroup?.workgroup ?? 0,
        workgroupTxt: defaultWorkgroup?.workgroupTxt ?? "",
        subject: "",
        bookTo: defaultBookTo,
        content1: "",
        content2: "",
        content3: "",
        bookType: 0,
        recipientPersonId: recipients[0]?.personId ?? "",
      }}
    />
  );
}
