import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PersonSysAdminForm } from "@/components/person/person-sys-admin-form";
import {
  canManagePersonStaffPermissions,
  getPersonPermissions,
} from "@/lib/person/permissions";
import { listDistrictStaffForPersonPicker } from "@/lib/person/permissions/queries";

export default async function PersonSysAdminNewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getPersonPermissions(Number(session.user.id));
  if (!canManagePersonStaffPermissions(session.user)) {
    redirect("/modules/person/staff");
  }

  const staffOptions = await listDistrictStaffForPersonPicker();

  return (
    <PersonSysAdminForm
      staffOptions={staffOptions}
      cancelHref="/modules/person/settings/sys-admin"
    />
  );
}
