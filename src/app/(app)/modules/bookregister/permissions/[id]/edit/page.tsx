import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { PermissionForm } from "@/components/bookregister/permission-form";
import {
  canManageDistrictYears,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { updateDistrictRegisterPermission } from "@/lib/bookregister/permissions/actions";
import {
  getDistrictRegisterPermission,
  listDistrictStaffForPicker,
} from "@/lib/bookregister/permissions/queries";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditDistrictPermissionPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const session = await auth();
  if (!session?.user) redirect("/login");

  const sessionPerms = await getBookregisterPermissions(Number(session.user.id));
  if (!canManageDistrictYears(session.user, sessionPerms)) {
    redirect("/modules/bookregister");
  }

  const row = await getDistrictRegisterPermission(id);
  if (!row) notFound();

  const staffOptions = await listDistrictStaffForPicker(row.userId);
  const currentStaff: typeof staffOptions = [
    {
      userId: row.userId,
      personId: row.personId,
      label: row.displayName,
    },
    ...staffOptions,
  ];

  const boundUpdate = updateDistrictRegisterPermission.bind(null, id);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <PermissionForm
        title="แก้ไขเจ้าหน้าที่"
        cancelHref="/modules/bookregister/permissions"
        staffOptions={currentStaff}
        action={boundUpdate}
        defaultValues={{
          userId: row.userId,
          p1: row.p1 === 1,
          p2: row.p2 === 1,
          p3: row.p3 === 1,
          canViewSecret: row.canViewSecret,
        }}
      />
    </section>
  );
}
