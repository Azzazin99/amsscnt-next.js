import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Paperclip } from "lucide-react";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { UrgencyLevelBadge } from "@/components/bookregister/urgency-level-badge";
import {
  canAccessSecretLevel,
  canEditCommandRecord,
  canViewDistrictRegisters,
  canWriteDistrictRegisters,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { getDistrictCertificate } from "@/lib/bookregister/certificate/queries";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";
import {
  secretLevelLabel,
  urgencyLevelLabel,
} from "@/lib/bookregister/regulation-fields";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DistrictCertificateDetailPage({
  params,
}: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canViewDistrictRegisters(session.user, perms)) {
    redirect("/modules/bookregister");
  }

  const row = await getDistrictCertificate(id);
  if (!row) notFound();

  if (!canAccessSecretLevel(session.user, perms, row.secretLevel)) {
    notFound();
  }

  const canEdit =
    canWriteDistrictRegisters(session.user, perms) &&
    canEditCommandRecord(
      session.user,
      perms,
      row.officerId,
      row.registerDate,
    );

  const fields: Array<[string, React.ReactNode]> = [
    ["เลขทะเบียนเกียรติบัตร", `${row.registerNumber}/${row.year}`],
    ["เลขที่หนังสือ", (
      <>
        {row.bookNo || "—"}
        <UrgencyLevelBadge level={row.urgencyLevel} className="ml-1" />
      </>
    )],
    ["ลงวันที่", formatThaiDate(row.signdate)],
    ["เรื่อง", row.subject || "—"],
    ["หมายเหตุ", row.comment || "—"],
    ["วันลงทะเบียน", formatThaiDate(row.registerDate)],
    ["ผู้ลงทะเบียน", row.officerName || "—"],
    ["ชั้นความเร็ว", (
      <>
        {urgencyLevelLabel(row.urgencyLevel)}
        <UrgencyLevelBadge level={row.urgencyLevel} className="ml-1" />
      </>
    )],
    ["ชั้นความลับ", secretLevelLabel(row.secretLevel)],
  ];

  return (
    <section className="mx-auto max-w-2xl rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-primary">
        รายละเอียดทะเบียนเกียรติบัตร
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
            {row.fileName ? (
              <Link
                href={`/api/bookregister/certificate/${row.id}/file`}
                className="inline-flex items-center gap-1.5 font-medium text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Paperclip className="size-4 shrink-0" aria-hidden />
                {row.fileName}
              </Link>
            ) : (
              <span className="text-muted-foreground">ไม่มีไฟล์แนบ</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/modules/bookregister/certificate"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          กลับรายการ
        </Link>
        {canEdit ? (
          <Link
            href={`/modules/bookregister/certificate/${row.id}/edit`}
            className={cn(buttonVariants())}
          >
            แก้ไข
          </Link>
        ) : null}
      </div>
    </section>
  );
}

