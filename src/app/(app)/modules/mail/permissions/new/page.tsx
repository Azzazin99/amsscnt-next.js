import { MailPermissionForm } from "@/components/mail/mail-permission-form";
import { createMailPermission } from "@/lib/mail/actions";
import { listStaffForMailPermissionPicker } from "@/lib/mail/queries";
import { requireMailSettingsAccess } from "@/lib/mail/scope";

export default async function MailPermissionNewPage() {
  await requireMailSettingsAccess();
  const staffOptions = await listStaffForMailPermissionPicker();

  return (
    <MailPermissionForm
      action={createMailPermission}
      staffOptions={staffOptions}
      title="เพิ่มเจ้าหน้าที่"
      cancelHref="/modules/mail/permissions"
    />
  );
}
