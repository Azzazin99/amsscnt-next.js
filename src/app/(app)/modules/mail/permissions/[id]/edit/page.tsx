import { notFound } from "next/navigation";
import { MailPermissionForm } from "@/components/mail/mail-permission-form";
import { updateMailPermission } from "@/lib/mail/actions";
import {
  getMailModulePermission,
  listStaffForMailPermissionPicker,
} from "@/lib/mail/queries";
import { requireMailStaffPermissionsAccess } from "@/lib/mail/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function MailPermissionEditPage({ params }: Props) {
  await requireMailStaffPermissionsAccess();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const row = await getMailModulePermission(id);
  if (!row) notFound();

  const staffOptions = await listStaffForMailPermissionPicker(row.userId);

  async function saveAction(formData: FormData) {
    "use server";
    return updateMailPermission(id, formData);
  }

  return (
    <MailPermissionForm
      action={saveAction}
      staffOptions={staffOptions}
      title="แก้ไขเจ้าหน้าที่"
      cancelHref="/modules/mail/permissions"
      lockUser
      defaultValues={{
        userId: row.userId,
        p1: row.p1 === 1,
        officerPersonId: row.officerPersonId,
      }}
    />
  );
}
