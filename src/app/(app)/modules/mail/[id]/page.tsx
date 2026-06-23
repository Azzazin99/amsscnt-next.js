import Link from "next/link";
import { notFound } from "next/navigation";
import { MailAttachments } from "@/components/mail/mail-attachments";
import { acknowledgeMailRecipient } from "@/lib/mail/acknowledge";
import { canWriteMail } from "@/lib/mail/permissions";
import {
  canViewMailDocument,
  getInboxRecipientRow,
  getMailDocument,
  listMailRecipients,
} from "@/lib/mail/queries";
import { requireMailScope } from "@/lib/mail/scope";
import { db } from "@/lib/db";
import { people } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { formatThaiDate } from "@/lib/format/thai-date";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function MailDetailPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const { user, perms } = await requireMailScope();
  const doc = await getMailDocument(id);
  if (!doc) notFound();

  const canView = await canViewMailDocument(doc, user.personId);
  if (!canView) notFound();

  const inboxRow = await getInboxRecipientRow(doc.refId, user.personId);

  if (inboxRow != null && !inboxRow.answered) {
    await acknowledgeMailRecipient(doc.refId, user.personId, id);
  }

  const [recipients, senderPerson] = await Promise.all([
    listMailRecipients(doc.refId),
    db
      .select({
        prefix: people.prefix,
        firstName: people.firstName,
        lastName: people.lastName,
      })
      .from(people)
      .where(eq(people.personId, doc.senderPersonId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  const isSender = doc.senderPersonId === user.personId;
  const isRecipient = inboxRow != null;
  const canUpload = canWriteMail(user, perms) && isSender;

  const senderLabel =
    formatPersonName({
      prefix: senderPerson?.prefix,
      firstName: senderPerson?.firstName,
      lastName: senderPerson?.lastName,
      fallback: doc.senderPersonId,
    }) || doc.senderPersonId;

  const fields = [
    ["เรื่อง", doc.subject],
    ["ข้อความ", doc.detail || "—"],
    ["วันที่ส่ง", formatThaiDate(doc.sendDate.toISOString().slice(0, 10))],
    ["ผู้ส่ง", senderLabel],
    ["รหัสอ้างอิง", doc.refId],
  ] as const;

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-primary">
            รายละเอียดหนังสือเวียน
          </h2>
          <Link
            href={isSender ? "/modules/mail/sent" : "/modules/mail/inbox"}
            className="text-sm text-primary hover:underline"
          >
            กลับรายการ
          </Link>
        </div>

        <dl className="space-y-3 text-sm">
          {fields.map(([label, value]) => (
            <div key={label} className="grid gap-1 sm:grid-cols-[8rem_1fr]">
              <dt className="font-medium text-muted-foreground">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        {isRecipient ? (
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
              <span>{r.label}</span>
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

      <MailAttachments documentId={id} canUpload={canUpload} />
    </section>
  );
}
