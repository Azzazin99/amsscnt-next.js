import { notFound } from "next/navigation";
import { AchievementPermissionForm } from "@/components/achievement/achievement-permission-form";
import { updateAchievementPermission } from "@/lib/achievement/actions";
import {
  getAchievementModulePermission,
  listDistrictStaffForAchievementPicker,
} from "@/lib/achievement/queries";

type Props = { params: Promise<{ id: string }> };

export default async function AchievementPermissionEditPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  const row = await getAchievementModulePermission(id);
  if (!row) notFound();

  const staffOptions = await listDistrictStaffForAchievementPicker(row.userId);

  return (
    <AchievementPermissionForm
      action={(formData) => updateAchievementPermission(id, formData)}
      staffOptions={staffOptions}
      title="แก้ไขสิทธิ์ผลสัมฤทธิ์"
      cancelHref="/modules/achievement/permissions"
      lockUser
      defaultValues={{
        userId: row.userId,
        p1: row.p1 === 1,
        p2: row.p2 === 1,
        p3: row.p3 === 1,
        officerPersonId: row.officerPersonId,
      }}
    />
  );
}
