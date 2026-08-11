import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PermissionForm } from "@/components/bookregister/permission-form";
import {
  canManageBookregisterStaffPermissions,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { createDistrictRegisterPermission } from "@/lib/bookregister/permissions/actions";
import { listDistrictStaffForPicker } from "@/lib/bookregister/permissions/queries";

export default async function NewDistrictPermissionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canManageBookregisterStaffPermissions(session.user)) {
    redirect("/modules/bookregister");
  }

  const staffOptions = await listDistrictStaffForPicker();

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      {staffOptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          ไม่มีบุคลากรเขตที่มีบัญชีผู้ใช้เหลือให้เพิ่ม — ต้องมี user ในระบบก่อน
        </p>
      ) : (
        <PermissionForm
          title="เพิ่มเจ้าหน้าที่"
          cancelHref="/modules/bookregister/permissions"
          staffOptions={staffOptions}
          action={createDistrictRegisterPermission}
        />
      )}
    </section>
  );
}
