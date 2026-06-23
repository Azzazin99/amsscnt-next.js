import Link from "next/link";
import { notFound } from "next/navigation";
import { Paperclip } from "lucide-react";
import { ForwardSendToBookSheet } from "@/components/bookregister/send/forward-send-to-book-sheet";
import { buttonVariants } from "@/components/ui/button";
import { forwardSendToBook } from "@/lib/book/forward-from-register";
import {
  listActiveSchoolsForBook,
  listBookGroupsForSelect,
} from "@/lib/book/queries";
import { UrgencyLevelBadge } from "@/components/bookregister/urgency-level-badge";
import {
  canAccessSecretLevel,
  canModifyOwnSendRecord,
} from "@/lib/bookregister/permissions";
import {
  officeTypeLabel,
  secretLevelLabel,
  urgencyLevelLabel,
} from "@/lib/bookregister/regulation-fields";
import {
  getDistrictSend,
  listDistrictSendFiles,
} from "@/lib/bookregister/send/queries";
import {
  canWriteRegisters,
  requireBookregisterScope,
} from "@/lib/bookregister/scope";
import { cleanLegacyText } from "@/lib/format/clean-text";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DistrictSendDetailPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const { user, perms, scope } = await requireBookregisterScope();

  const row = await getDistrictSend(id, scope);
  if (!row) notFound();

  if (!canAccessSecretLevel(user, perms, row.secretLevel)) {
    notFound();
  }

  const files = await listDistrictSendFiles(row.refId);

  const canForward =
    scope.kind === "district" &&
    canWriteRegisters(user, perms, scope) &&
    !row.forwardedToSchools;

  const [schools, groups] = canForward
    ? await Promise.all([
        listActiveSchoolsForBook(),
        listBookGroupsForSelect(),
      ])
    : [[], []];

  const canEdit =
    canWriteRegisters(user, perms, scope) &&
    canModifyOwnSendRecord(
      user,
      perms,
      row.officerId,
      row.registerDate,
    );

  const fields = [
    ["เลขทะเบียนส่ง", row.registerNumber],
    ["ปี", row.year],
    ["เลขที่หนังสือ", row.bookNo],
    ["ลงวันที่", formatThaiDate(row.signdate)],
    ["จาก", cleanLegacyText(row.bookFrom)],
    ["ถึง", cleanLegacyText(row.bookTo)],
    ["เรื่อง", row.subject],
    ...(scope.kind === "district"
      ? ([
          ["กลุ่มปฏิบัติ", row.workgroupName],
        ] as const)
      : []),
    ["บุคคลปฏิบัติ", row.operation],
    ["หมายเหตุ", row.comment],
    ["วันลงทะเบียน", formatThaiDate(row.registerDate)],
    ["ประเภทหนังสือ", officeTypeLabel(row.officeType)],
    [
      "ชั้นความเร็ว",
      <>
        {urgencyLevelLabel(row.urgencyLevel)}
        <UrgencyLevelBadge level={row.urgencyLevel} className="ml-1" />
      </>,
    ],
    ["ชั้นความลับ", secretLevelLabel(row.secretLevel)],
    [
      "ส่งต่อโรงเรียน",
      row.forwardedToSchools ? "ใช่" : "ไม่",
    ],
  ] as const;

  return (
    <section className="mx-auto max-w-2xl rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-primary">
        รายละเอียดทะเบียนส่ง
      </h2>

      <dl className="space-y-3 text-sm">
        {fields.map(([label, value]) => (
          <div key={label} className="grid gap-1 sm:grid-cols-[8rem_1fr]">
            <dt className="font-medium text-muted-foreground">{label}</dt>
            <dd>{value || "—"}</dd>
          </div>
        ))}
        <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
          <dt className="font-medium text-muted-foreground">ไฟล์แนบ</dt>
          <dd>
            {files.length > 0 ? (
              <ul className="space-y-1">
                {files.map((f) => (
                  <li key={f.id}>
                    <a
                      href={`/api/bookregister/send/${id}/files/${f.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Paperclip className="size-4 shrink-0" />
                      {f.fileDes || f.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">ยังไม่มีไฟล์แนบ</p>
            )}
            {canEdit && files.length === 0 ? (
              <Link
                href={`/modules/bookregister/send/${row.id}/edit`}
                className="mt-1 inline-block text-sm text-primary hover:underline"
              >
                แนบไฟล์
              </Link>
            ) : null}
            {canEdit && files.length > 0 ? (
              <Link
                href={`/modules/bookregister/send/${row.id}/edit`}
                className="mt-1 inline-block text-sm text-primary hover:underline"
              >
                จัดการไฟล์แนบ
              </Link>
            ) : null}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        {canForward ? (
          <ForwardSendToBookSheet
            registerSendId={row.id}
            action={forwardSendToBook}
            schools={schools}
            groups={groups}
          />
        ) : null}
        {canEdit ? (
          <Link
            href={`/modules/bookregister/send/${row.id}/edit`}
            className={cn(buttonVariants(), "min-h-10")}
          >
            แก้ไข
          </Link>
        ) : null}
        <Link
          href="/modules/bookregister/send"
          className={cn(buttonVariants({ variant: "outline" }), "min-h-10")}
        >
          ย้อนกลับ
        </Link>
      </div>
    </section>
  );
}
