import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CertificateForm } from "@/components/bookregister/certificate/certificate-form";
import {
  canAccessSecretLevel,
  canEditCommandRecord,
  canViewDistrictRegisters,
  canWriteDistrictRegisters,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { updateDistrictCertificate } from "@/lib/bookregister/certificate/actions";
import { getDistrictCertificate } from "@/lib/bookregister/certificate/queries";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditDistrictCertificatePage({
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
  if (!canWriteDistrictRegisters(session.user, perms)) {
    redirect("/modules/bookregister/certificate");
  }

  const row = await getDistrictCertificate(id);
  if (!row) notFound();

  if (!canAccessSecretLevel(session.user, perms, row.secretLevel)) {
    redirect("/modules/bookregister/certificate");
  }

  if (
    !canEditCommandRecord(
      session.user,
      perms,
      row.officerId,
      row.registerDate,
    )
  ) {
    redirect("/modules/bookregister/certificate");
  }

  const defaults = {
    bookNo: row.bookNo ?? undefined,
    signdate: row.signdate ?? undefined,
    subject: row.subject ?? undefined,
    comment: row.comment ?? undefined,
    fileName: row.fileName,
    certificateId: row.id,
    urgencyLevel: row.urgencyLevel,
    secretLevel: row.secretLevel,
  };

  const boundUpdate = updateDistrictCertificate.bind(null, id);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <CertificateForm
        title={`แก้ไขทะเบียนเกียรติบัตร เลขที่ ${row.registerNumber}/${row.year}`}
        cancelHref="/modules/bookregister/certificate"
        defaultValues={defaults}
        action={boundUpdate}
        mode="edit"
      />
    </section>
  );
}

