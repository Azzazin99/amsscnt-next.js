import { notFound, redirect } from "next/navigation";
import { NewsPermissionForm } from "@/components/news/news-permission-form";
import { updateNewsPermission } from "@/lib/news/actions";
import { canManageNewsSettings } from "@/lib/news/permissions";
import {
  getNewsModulePermission,
  listStaffForNewsPermissionPicker,
} from "@/lib/news/queries";
import { requireNewsScope } from "@/lib/news/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NewsPermissionEditPage({ params }: Props) {
  const { user } = await requireNewsScope();
  if (!canManageNewsSettings(user)) redirect("/modules/news");

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const row = await getNewsModulePermission(id);
  if (!row) notFound();

  const staffOptions = await listStaffForNewsPermissionPicker(row.userId);

  return (
    <NewsPermissionForm
      action={updateNewsPermission.bind(null, id)}
      staffOptions={staffOptions}
      title="แก้ไขเจ้าหน้าที่"
      cancelHref="/modules/news/permissions"
      defaultValues={{
        userId: row.userId,
        p1: row.p1 === 1,
        officerPersonId: row.officerPersonId,
      }}
      lockUser
    />
  );
}
