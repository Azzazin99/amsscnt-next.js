import { PermissionForm } from "@/components/bookregister/permission-form";
import { createAdminRegisterPermission } from "@/lib/core/module-permissions/actions";
import { listDistrictStaffForPicker } from "@/lib/bookregister/permissions/queries";

export default async function NewAdminPermissionPage() {
  const staffOptions = await listDistrictStaffForPicker();

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      {staffOptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">ไม่มีบุคลากรเขตที่มีบัญชีเหลือให้เพิ่ม</p>
      ) : (
        <PermissionForm
          title="เพิ่มสิทธิ์ทะเบียนหนังสือ"
          cancelHref="/admin/permissions"
          staffOptions={staffOptions}
          action={createAdminRegisterPermission}
        />
      )}
    </section>
  );
}
