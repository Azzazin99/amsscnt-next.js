import { notFound, redirect } from "next/navigation";
import {
  ReceiveForm,
  type ReceiveFormDefaults,
} from "@/components/bookregister/receive/receive-form";
import { ReceiveAttachments } from "@/components/bookregister/receive/receive-attachments";
import {
  canAccessSecretLevel,
  canModifyOwnReceiveRecord,
} from "@/lib/bookregister/permissions";
import { updateDistrictReceive } from "@/lib/bookregister/receive/actions";
import {
  findSchoolCodeByName,
  getDistrictReceive,
  listSchoolsForSelect,
  listWorkgroupsForFilter,
} from "@/lib/bookregister/receive/queries";
import {
  canWriteRegisters,
  requireBookregisterScope,
} from "@/lib/bookregister/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditDistrictReceivePage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const { user, perms, scope } = await requireBookregisterScope();

  if (!canWriteRegisters(user, perms, scope)) {
    redirect("/modules/bookregister/receive");
  }

  const row = await getDistrictReceive(id, scope);
  if (!row) notFound();

  if (!canAccessSecretLevel(user, perms, row.secretLevel)) {
    notFound();
  }

  if (
    !canModifyOwnReceiveRecord(
      user,
      perms,
      row.officerId,
      row.registerDate,
    )
  ) {
    redirect("/modules/bookregister/receive");
  }

  const isSchool = scope.kind === "school";

  const [schools, workgroups] = await Promise.all([
    isSchool ? Promise.resolve([]) : listSchoolsForSelect(),
    isSchool ? Promise.resolve([]) : listWorkgroupsForFilter(),
  ]);

  const matchedCode =
    !isSchool && row.bookFrom
      ? await findSchoolCodeByName(row.bookFrom)
      : null;

  const defaults: ReceiveFormDefaults = {
    schoolCode: matchedCode ?? (row.bookFrom ? "other" : ""),
    bookFrom: isSchool
      ? (row.bookFrom ?? undefined)
      : matchedCode
        ? undefined
        : (row.bookFrom ?? undefined),
    bookNo: row.bookNo ?? undefined,
    signdate: row.signdate ?? undefined,
    bookTo: row.bookTo ?? undefined,
    subject: row.subject ?? undefined,
    workgroupId: row.workgroupId ?? undefined,
    operation: row.operation ?? undefined,
    comment: row.comment ?? undefined,
    urgencyLevel: row.urgencyLevel,
    secretLevel: row.secretLevel,
    recordType: row.recordType,
    fromBookModule: row.bookLink > 0,
    bookLink: row.bookLink,
  };

  const boundUpdate = updateDistrictReceive.bind(null, id);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <ReceiveForm
        title={`แก้ไขทะเบียนรับ เลขที่ ${row.registerNumber}/${row.year}`}
        cancelHref="/modules/bookregister/receive"
        schools={schools}
        workgroups={workgroups}
        defaultValues={defaults}
        variant={isSchool ? "school" : "district"}
        action={boundUpdate}
      />

      <ReceiveAttachments receiveId={row.id} />
    </section>
  );
}
