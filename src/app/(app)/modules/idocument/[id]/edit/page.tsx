import { notFound, redirect } from "next/navigation";
import { IdocumentForm } from "@/components/idocument/idocument-form";
import { updateIdocument } from "@/lib/idocument/actions";
import {
  getDocumentById,
  getDocumentRecipientPersonId,
  listRecipientOptions,
  listWorkgroupOptions,
} from "@/lib/idocument/queries";
import { requireIdocumentScope } from "@/lib/idocument/scope";
import { canEditIdocumentStatus } from "@/lib/idocument/status";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function IdocumentEditPage({ params }: Props) {
  const { user, canWrite } = await requireIdocumentScope();
  if (!canWrite) redirect("/modules/idocument");

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const document = await getDocumentById(id);
  if (!document) notFound();

  if (
    document.officer !== user.personId &&
    !user.isSuperAdmin &&
    !user.isAdmin
  ) {
    redirect(`/modules/idocument/${id}`);
  }

  if (!canEditIdocumentStatus(document.bookStatus)) {
    redirect(`/modules/idocument/${id}`);
  }

  const [workgroups, recipients, recipientPersonId] = await Promise.all([
    listWorkgroupOptions(),
    listRecipientOptions(),
    getDocumentRecipientPersonId(id),
  ]);

  const boundUpdate = updateIdocument.bind(null, id);

  return (
    <IdocumentForm
      title={`แก้ไขบันทึกเสนอ ${document.bookNo}`}
      cancelHref={`/modules/idocument/${id}`}
      action={boundUpdate}
      workgroups={workgroups}
      recipients={recipients}
      defaultValues={{
        workgroup: document.workgroup,
        workgroupTxt: document.workgroupTxt,
        subject: document.subject,
        bookTo: document.bookTo,
        content1: document.content1,
        content2: document.content2,
        content3: document.content3,
        bookType: document.bookType,
        recipientPersonId:
          recipientPersonId ?? recipients[0]?.personId ?? "",
      }}
    />
  );
}
