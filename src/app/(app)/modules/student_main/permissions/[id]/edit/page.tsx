import { notFound } from "next/navigation";
import { StudentPermissionForm } from "@/components/student-main/student-permission-form";
import { updateStudentPermission } from "@/lib/student-main/actions";
import {
  getStudentModulePermission,
  listDistrictStaffForStudentPicker,
} from "@/lib/student-main/queries";

type Props = { params: Promise<{ id: string }> };

export default async function StudentMainPermissionEditPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  const row = await getStudentModulePermission(id);
  if (!row) notFound();

  const staffOptions = await listDistrictStaffForStudentPicker(row.userId);

  return (
    <StudentPermissionForm
      action={(formData) => updateStudentPermission(id, formData)}
      staffOptions={staffOptions}
      title="แก้ไขสิทธิ์ข้อมูลนักเรียน"
      cancelHref="/modules/student_main/permissions"
      lockUser
      defaultValues={{
        userId: row.userId,
        p1: row.p1 === 1,
        p2: row.p2 === 1,
        officerPersonId: row.officerPersonId,
      }}
    />
  );
}
