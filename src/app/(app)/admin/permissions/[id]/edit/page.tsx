import { notFound } from "next/navigation";
import { PermissionForm } from "@/components/bookregister/permission-form";
import { updateAdminRegisterPermission } from "@/lib/core/module-permissions/actions";
import {
  getDistrictRegisterPermission,
  listDistrictStaffForPicker,
} from "@/lib/bookregister/permissions/queries";

type Props = { params: Promise<{ id: string }> };

export default async function EditAdminPermissionPage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isFinite(id) || id < 1) notFound();

  const row = await getDistrictRegisterPermission(id);
  if (!row) notFound();

  const staffOptions = await listDistrictStaffForPicker(row.userId);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <PermissionForm
        title="แก้ไขสิทธิ์ทะเบียนหนังสือ"
        cancelHref="/admin/permissions"
        staffOptions={staffOptions}
        action={updateAdminRegisterPermission.bind(null, id)}
        lockUser
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
