import { StudentPermissionForm } from "@/components/student-main/student-permission-form";
import { createStudentPermission } from "@/lib/student-main/actions";
import { listDistrictStaffForStudentPicker } from "@/lib/student-main/queries";

export default async function StudentMainPermissionNewPage() {
  const staffOptions = await listDistrictStaffForStudentPicker();
  return (
    <StudentPermissionForm
      action={createStudentPermission}
      staffOptions={staffOptions}
      title="เพิ่มสิทธิ์ข้อมูลนักเรียน"
      cancelHref="/modules/student_main/permissions"
    />
  );
}
