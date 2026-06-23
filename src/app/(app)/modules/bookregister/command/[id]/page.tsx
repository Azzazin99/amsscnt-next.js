import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Paperclip } from "lucide-react";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import {
  canEditCommandRecord,
  canViewDistrictRegisters,
  canWriteDistrictRegisters,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { getDistrictCommand } from "@/lib/bookregister/command/queries";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DistrictCommandDetailPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canViewDistrictRegisters(session.user, perms)) {
    redirect("/modules/bookregister");
  }

  const row = await getDistrictCommand(id);
  if (!row) notFound();

  const canEdit =
    canWriteDistrictRegisters(session.user, perms) &&
    canEditCommandRecord(
      session.user,
      perms,
      row.officerId,
      row.registerDate,
    );

  const fields = [
    ["เลขทะเบียนคำสั่ง", row.registerNumber],
    ["ปี", row.year],
    ["เลขที่หนังสือ", row.bookNo],
    ["สั่ง ณ วันที่", formatThaiDate(row.signdate)],
    ["เรื่อง", row.subject],
    ["หมายเหตุ", row.comment],
    ["วันลงทะเบียน", formatThaiDate(row.registerDate)],
    ["ผู้ลงทะเบียน", row.officerName],
  ] as const;

  return (
    <section className="mx-auto max-w-2xl rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-primary">
        รายละเอียดทะเบียนคำสั่ง
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
                href={`/api/bookregister/command/${row.id}/file`}
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
          href="/modules/bookregister/command"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          กลับรายการ
        </Link>
        {canEdit ? (
          <Link
            href={`/modules/bookregister/command/${row.id}/edit`}
            className={cn(buttonVariants())}
          >
            แก้ไข
          </Link>
        ) : null}
      </div>
    </section>
  );
}
