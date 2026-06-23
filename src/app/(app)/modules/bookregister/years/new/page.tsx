import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { YearForm } from "@/components/bookregister/year-form";
import {
  canManageDistrictYears,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { createDistrictYear } from "@/lib/bookregister/years/actions";

export default async function NewDistrictYearPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canManageDistrictYears(session.user, perms)) {
    redirect("/modules/bookregister");
  }

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <YearForm
        title="เพิ่มปีปฏิทิน"
        cancelHref="/modules/bookregister/years"
        action={createDistrictYear}
      />
    </section>
  );
}
