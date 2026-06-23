import { SpacialStudentPermissionForm } from "@/components/spacial-student/spacial-student-permission-form";
import { createSpacialStudentPermission } from "@/lib/spacial-student/actions";
import { listDistrictStaffForSpacialPicker } from "@/lib/spacial-student/queries";

export default async function SpacialStudentPermissionNewPage() {
  const staffOptions = await listDistrictStaffForSpacialPicker();
  return (
    <SpacialStudentPermissionForm
      action={createSpacialStudentPermission}
      staffOptions={staffOptions}
      title="เพิ่มสิทธิ์นักเรียนพิเศษ"
      cancelHref="/modules/spacial_student/permissions"
    />
  );
}
