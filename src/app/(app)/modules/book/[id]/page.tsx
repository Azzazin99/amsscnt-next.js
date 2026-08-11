import Link from "next/link";
import { notFound } from "next/navigation";
import { BookAckButton } from "@/components/book/book-ack-button";
import { BookAttachments } from "@/components/book/book-attachments";
import { PrintButton } from "@/components/book/book-print-button";
import { UrgencyLevelBadge } from "@/components/bookregister/urgency-level-badge";
import { acknowledgeBookDocument } from "@/lib/book/actions";
import {
  canAccessBookSecretLevel,
  canWriteBook,
} from "@/lib/book/permissions";
import { findRegisterReceiveByBookLink } from "@/lib/book/registry-link";
import {
  canViewBookDocument,
  getBookDocument,
  getInboxRecipientRow,
  listBookRecipients,
} from "@/lib/book/queries";
import { requireBookScope } from "@/lib/book/scope";
import {
  secretLevelLabel,
  urgencyLevelLabel,
} from "@/lib/bookregister/regulation-fields";
import { formatThaiDate } from "@/lib/format/thai-date";

type Props = {
  params: Promise<{ id: string }>;
};

function recipientLabel(sendTo: string): string {
  if (sendTo === "saraban") return "สำนักงานเขต (สารบรรณ)";
  return sendTo;
}

export default async function BookDetailPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const { user, perms, scope } = await requireBookScope();
  const doc = await getBookDocument(id);
  if (!doc) notFound();

  if (!canAccessBookSecretLevel(user, perms, doc.secretLevel)) {
    notFound();
  }

  const canView = await canViewBookDocument(doc, scope);
  if (!canView) notFound();

  const [recipients, inboxRow, linkedReceiveId] = await Promise.all([
    listBookRecipients(doc.refId),
    getInboxRecipientRow(doc.refId, scope),
    findRegisterReceiveByBookLink(id, scope),
  ]);

  const isSender =
    scope.kind === "district"
      ? doc.senderSchoolId == null
      : doc.senderSchoolId === scope.schoolId;

  const linkedSendId =
    doc.bookType === 6 && doc.bookRegisLink > 0 ? doc.bookRegisLink : null;
  const receiveLinkId =
    linkedReceiveId ??
    (doc.bookRegisLink > 0 && doc.bookType !== 6 ? doc.bookRegisLink : null);

  const canUpload = canWriteBook(user, perms) && isSender;
  const showAck = inboxRow != null && !inboxRow.answered;

  const fields = [
    ["เลขที่หนังสือ", doc.bookNo],
    ["ลงวันที่", formatThaiDate(doc.signDate)],
    ["เรื่อง", doc.subject],
    ["รายละเอียด", doc.detail || "—"],
    ["วันที่ส่ง", formatThaiDate(doc.sendDate.toISOString().slice(0, 10))],
    [
      "ชั้นความเร็ว",
      <>
        {urgencyLevelLabel(doc.urgencyLevel)}
        <UrgencyLevelBadge level={doc.urgencyLevel} className="ml-1" />
      </>,
    ],
    ["ชั้นความลับ", secretLevelLabel(doc.secretLevel)],
    ["ผู้ส่ง", doc.officeCode],
    ["รหัสอ้างอิง", doc.refId],
    ...(doc.bookType === 3 ? ([["ประเภท", "หนังสือเวียน"]] as const) : []),
    ...(receiveLinkId
      ? ([
          [
            "ทะเบียนรับที่เชื่อม",
            <Link
              key={`receive-${receiveLinkId}`}
              href={`/modules/bookregister/receive/${receiveLinkId}`}
              className="text-primary hover:underline"
            >
              เปิดทะเบียนรับ #{receiveLinkId}
            </Link>,
          ],
        ] as const)
      : []),
    ...(linkedSendId
      ? ([
          [
            "ทะเบียนส่งต้นทาง",
            <Link
              key={`send-${linkedSendId}`}
              href={`/modules/bookregister/send/${linkedSendId}`}
              className="text-primary hover:underline"
            >
              เปิดทะเบียนส่ง #{linkedSendId}
            </Link>,
          ],
        ] as const)
      : []),
  ] as const;

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-primary">รายละเอียดหนังสือ</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/modules/book/${id}/print`}
              className="text-sm text-primary hover:underline"
            >
              พิมพ์หนังสือ
            </Link>
            <Link
              href={isSender ? "/modules/book/sent" : "/modules/book/inbox"}
              className="text-sm text-primary hover:underline"
            >
              กลับรายการ
            </Link>
          </div>
        </div>

        <dl className="space-y-3 text-sm">
          {fields.map(([label, value]) => (
            <div key={label} className="grid gap-1 sm:grid-cols-[8rem_1fr]">
              <dt className="font-medium text-muted-foreground">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        {showAck ? (
          <div className="mt-6 border-t pt-4">
            <BookAckButton documentId={id} action={acknowledgeBookDocument} />
          </div>
        ) : inboxRow?.answered ? (
          <p className="mt-4 text-sm text-green-700">ตอบรับแล้ว</p>
        ) : null}
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-primary">
          ผู้รับ ({recipients.length.toLocaleString("th-TH")} ราย)
        </h3>
        <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
          {recipients.slice(0, 50).map((r) => (
            <li key={r.id} className="flex justify-between gap-2 border-b py-1">
              <span>{recipientLabel(r.sendTo)}</span>
              <span className="text-muted-foreground">
                {r.answered ? "ตอบรับแล้ว" : "รอตอบรับ"}
              </span>
            </li>
          ))}
          {recipients.length > 50 ? (
            <li className="pt-1 text-muted-foreground">
              และอีก {(recipients.length - 50).toLocaleString("th-TH")} ราย
            </li>
          ) : null}
        </ul>
      </div>

      <BookAttachments documentId={id} canUpload={canUpload} />
    </section>
  );
}
