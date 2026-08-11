import { redirect } from "next/navigation";
import { BookobecPermissionForm } from "@/components/bookobec/bookobec-permission-form";
import { createBookobecPermission } from "@/lib/bookobec/actions";
import { canManageBookobecStaffPermissions } from "@/lib/bookobec/permissions";
import { listDistrictStaffForBookobecPicker } from "@/lib/bookobec/queries";
import { requireBookobecScope } from "@/lib/bookobec/scope";

export default async function BookobecPermissionNewPage() {
  const { user } = await requireBookobecScope();
  if (!canManageBookobecStaffPermissions(user)) {
    redirect("/modules/bookobec/inbox");
  }

  const staffOptions = await listDistrictStaffForBookobecPicker();

  return (
    <BookobecPermissionForm
      action={createBookobecPermission}
      staffOptions={staffOptions}
      title="เพิ่มเจ้าหน้าที่"
      cancelHref="/modules/bookobec/permissions"
    />
  );
}
