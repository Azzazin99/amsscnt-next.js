import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { YearForm } from "@/components/bookregister/year-form";
import {
  canManageDistrictYears,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { updateDistrictYear } from "@/lib/bookregister/years/actions";
import { getDistrictYear } from "@/lib/bookregister/years/queries";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditDistrictYearPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canManageDistrictYears(session.user, perms)) {
    redirect("/modules/bookregister");
  }

  const row = await getDistrictYear(id);
  if (!row) notFound();

  const boundUpdate = updateDistrictYear.bind(null, id);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <YearForm
        title="แก้ไขปีปฏิทิน"
        cancelHref="/modules/bookregister/years"
        action={boundUpdate}
        defaultValues={{
          year: row.year,
          yearActive: row.yearActive,
          startReceiveNum: row.startReceiveNum,
          startSendNum: row.startSendNum,
          startCommandNum: row.startCommandNum,
          startCertificateNum: row.startCertificateNum,
        }}
      />
    </section>
  );
}
