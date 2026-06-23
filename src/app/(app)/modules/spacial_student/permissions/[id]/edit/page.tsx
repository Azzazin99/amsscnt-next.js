import { notFound } from "next/navigation";
import { SpacialStudentPermissionForm } from "@/components/spacial-student/spacial-student-permission-form";
import { updateSpacialStudentPermission } from "@/lib/spacial-student/actions";
import {
  getSpacialStudentModulePermission,
  listDistrictStaffForSpacialPicker,
} from "@/lib/spacial-student/queries";

type Props = { params: Promise<{ id: string }> };

export default async function SpacialStudentPermissionEditPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  const row = await getSpacialStudentModulePermission(id);
  if (!row) notFound();

  const staffOptions = await listDistrictStaffForSpacialPicker(row.userId);

  return (
    <SpacialStudentPermissionForm
      action={(formData) => updateSpacialStudentPermission(id, formData)}
      staffOptions={staffOptions}
      title="แก้ไขสิทธิ์นักเรียนพิเศษ"
      cancelHref="/modules/spacial_student/permissions"
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
