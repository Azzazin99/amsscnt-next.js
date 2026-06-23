import { AchievementPermissionForm } from "@/components/achievement/achievement-permission-form";
import { createAchievementPermission } from "@/lib/achievement/actions";
import { listDistrictStaffForAchievementPicker } from "@/lib/achievement/queries";

export default async function AchievementPermissionNewPage() {
  const staffOptions = await listDistrictStaffForAchievementPicker();
  return (
    <AchievementPermissionForm
      action={createAchievementPermission}
      staffOptions={staffOptions}
      title="เพิ่มสิทธิ์ผลสัมฤทธิ์"
      cancelHref="/modules/achievement/permissions"
    />
  );
}
