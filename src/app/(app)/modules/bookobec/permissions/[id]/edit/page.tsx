import { notFound, redirect } from "next/navigation";
import { BookobecPermissionForm } from "@/components/bookobec/bookobec-permission-form";
import { updateBookobecPermission } from "@/lib/bookobec/actions";
import { canManageBookobecStaffPermissions } from "@/lib/bookobec/permissions";
import {
  getBookobecModulePermission,
  listDistrictStaffForBookobecPicker,
} from "@/lib/bookobec/queries";
import { requireBookobecScope } from "@/lib/bookobec/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BookobecPermissionEditPage({ params }: Props) {
  const { user } = await requireBookobecScope();
  if (!canManageBookobecStaffPermissions(user)) {
    redirect("/modules/bookobec/inbox");
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const row = await getBookobecModulePermission(id);
  if (!row) notFound();

  const staffOptions = await listDistrictStaffForBookobecPicker(row.userId);

  return (
    <BookobecPermissionForm
      action={updateBookobecPermission.bind(null, id)}
      staffOptions={staffOptions}
      title="แก้ไขเจ้าหน้าที่"
      cancelHref="/modules/bookobec/permissions"
      defaultValues={{
        userId: row.userId,
        p1: row.p1 === 1,
        p2: row.p2 === 1,
        officerPersonId: row.officerPersonId,
      }}
      lockUser
    />
  );
}
