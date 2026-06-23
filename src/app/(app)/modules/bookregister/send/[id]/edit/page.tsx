import { notFound, redirect } from "next/navigation";
import {
  SendForm,
  type SendFormDefaults,
} from "@/components/bookregister/send/send-form";
import { SendAttachments } from "@/components/bookregister/send/send-attachments";
import {
  canAccessSecretLevel,
  canModifyOwnSendRecord,
} from "@/lib/bookregister/permissions";
import { updateDistrictSend } from "@/lib/bookregister/send/actions";
import { getDistrictSend } from "@/lib/bookregister/send/queries";
import { listWorkgroupsForFilter } from "@/lib/bookregister/receive/queries";
import {
  canWriteRegisters,
  requireBookregisterScope,
} from "@/lib/bookregister/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditDistrictSendPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const { user, perms, scope } = await requireBookregisterScope();

  if (!canWriteRegisters(user, perms, scope)) {
    redirect("/modules/bookregister/send");
  }

  const row = await getDistrictSend(id, scope);
  if (!row) notFound();

  if (!canAccessSecretLevel(user, perms, row.secretLevel)) {
    notFound();
  }

  if (
    !canModifyOwnSendRecord(user, perms, row.officerId, row.registerDate)
  ) {
    redirect("/modules/bookregister/send");
  }

  const isSchool = scope.kind === "school";
  const workgroups = isSchool ? [] : await listWorkgroupsForFilter();

  const defaults: SendFormDefaults = {
    bookNo: row.bookNo ?? undefined,
    bookFrom: row.bookFrom ?? undefined,
    bookTo: row.bookTo ?? undefined,
    signdate: row.signdate ?? undefined,
    subject: row.subject ?? undefined,
    workgroupId: row.workgroupId ?? undefined,
    operation: row.operation ?? undefined,
    comment: row.comment ?? undefined,
    secretLevel: row.secretLevel,
    urgencyLevel: row.urgencyLevel,
    officeType: row.officeType,
  };

  const boundUpdate = updateDistrictSend.bind(null, id);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <SendForm
        title={`แก้ไขทะเบียนส่ง เลขที่ ${row.registerNumber}/${row.year}`}
        cancelHref="/modules/bookregister/send"
        workgroups={workgroups}
        defaultValues={defaults}
        variant={isSchool ? "school" : "district"}
        action={boundUpdate}
        mode="edit"
      />

      <SendAttachments sendId={row.id} />
    </section>
  );
}
