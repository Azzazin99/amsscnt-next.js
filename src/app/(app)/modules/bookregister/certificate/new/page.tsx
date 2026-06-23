import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CertificateForm } from "@/components/bookregister/certificate/certificate-form";
import {
  canViewDistrictRegisters,
  canWriteDistrictRegisters,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { createDistrictCertificate } from "@/lib/bookregister/certificate/actions";
import {
  allocateNextCertificateNumber,
} from "@/lib/bookregister/certificate/queries";
import { getActiveDistrictYear } from "@/lib/bookregister/years/queries";

export default async function NewDistrictCertificatePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canViewDistrictRegisters(session.user, perms)) {
    redirect("/modules/bookregister");
  }
  if (!canWriteDistrictRegisters(session.user, perms)) {
    redirect("/modules/bookregister/certificate");
  }

  const activeYear = await getActiveDistrictYear();
  const enabled = activeYear != null && activeYear.startCertificateNum > 0;
  if (!enabled) redirect("/modules/bookregister/certificate");

  const nextNumber = await allocateNextCertificateNumber(activeYear!.year);
  const defaults = {
    bookNo: `${nextNumber}/${activeYear!.year}`,
    urgencyLevel: 1,
    secretLevel: 0,
  };

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <CertificateForm
        title="ลงทะเบียนเกียรติบัตร"
        cancelHref="/modules/bookregister/certificate"
        defaultValues={defaults}
        action={createDistrictCertificate}
        mode="create"
      />
    </section>
  );
}

