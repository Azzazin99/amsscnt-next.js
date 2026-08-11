import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SchoolSarabanForm } from "@/components/book/school-saraban-form";
import { isBookModuleAdmin } from "@/lib/book/permissions";
import { saveSchoolSarabanPermission } from "@/lib/book/permissions/actions";
import {
  listSchoolsForPicker,
  listSchoolStaffForBookPicker,
} from "@/lib/book/permissions/queries";

import { resolveSchoolIdByCode } from "@/lib/book/scope";

export default async function NewSchoolSarabanPermissionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isDistrictAdmin = isBookModuleAdmin(session.user);
  const isSchoolAdmin =
    session.user.organizationType === "school" &&
    session.user.loginStatus >= 12 &&
    session.user.loginStatus <= 15;

  if (!isDistrictAdmin && !isSchoolAdmin) {
    redirect("/modules/book");
  }

  const schools = isDistrictAdmin ? await listSchoolsForPicker() : [];
  const userSchoolId = session.user.userSchoolCode
    ? await resolveSchoolIdByCode(session.user.userSchoolCode)
    : null;

  const initialSchoolId = isSchoolAdmin
    ? userSchoolId ?? 0
    : schools[0]?.id ?? 0;

  const initialStaffOptions = initialSchoolId
    ? await listSchoolStaffForBookPicker(initialSchoolId)
    : [];

  async function fetchStaffAction(schoolId: number) {
    "use server";
    return listSchoolStaffForBookPicker(schoolId);
  }

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <SchoolSarabanForm
        cancelHref="/modules/book/school-saraban-permissions"
        schools={schools}
        isDistrictAdmin={isDistrictAdmin}
        initialSchoolId={initialSchoolId}
        initialStaffOptions={initialStaffOptions}
        fetchStaffAction={isDistrictAdmin ? fetchStaffAction : undefined}
        action={saveSchoolSarabanPermission}
      />
    </section>
  );
}
