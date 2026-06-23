import { redirect } from "next/navigation";
import { NewsPermissionForm } from "@/components/news/news-permission-form";
import { createNewsPermission } from "@/lib/news/actions";
import { canManageNewsSettings } from "@/lib/news/permissions";
import { listStaffForNewsPermissionPicker } from "@/lib/news/queries";
import { requireNewsScope } from "@/lib/news/scope";

export default async function NewsPermissionNewPage() {
  const { user } = await requireNewsScope();
  if (!canManageNewsSettings(user)) redirect("/modules/news");

  const staffOptions = await listStaffForNewsPermissionPicker();

  return (
    <NewsPermissionForm
      action={createNewsPermission}
      staffOptions={staffOptions}
      title="เพิ่มเจ้าหน้าที่"
      cancelHref="/modules/news/permissions"
    />
  );
}
