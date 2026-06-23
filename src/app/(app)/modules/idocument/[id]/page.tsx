import { notFound } from "next/navigation";
import { IdocumentDetail } from "@/components/idocument/idocument-detail";
import {
  getDocumentById,
  listDocumentComments,
} from "@/lib/idocument/queries";
import { requireIdocumentScope } from "@/lib/idocument/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function IdocumentDetailPage({ params }: Props) {
  const { user, canWrite } = await requireIdocumentScope();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const document = await getDocumentById(id);
  if (!document) notFound();

  const comments = await listDocumentComments(id);

  return (
    <IdocumentDetail
      document={{
        id: document.id,
        bookNo: document.bookNo,
        bookDate: document.bookDate,
        subject: document.subject,
        bookTo: document.bookTo,
        workgroupTxt: document.workgroupTxt,
        officerName: document.officerName,
        officerPosition: document.officerPosition,
        bookStatus: document.bookStatus,
        bookType: document.bookType,
        preDocId: document.preDocId,
        content1: document.content1,
        content2: document.content2,
        content3: document.content3,
      }}
      comments={comments}
      canWrite={canWrite}
      isOwner={document.officer === user.personId}
    />
  );
}
