import { SpacialStudentForm } from "@/components/spacial-student/spacial-student-form";
import { createSpacialStudent } from "@/lib/spacial-student/actions";
import { listSchoolsForSpacialFilter } from "@/lib/spacial-student/queries";
import { requireSpacialStudentWriteAccess } from "@/lib/spacial-student/scope";

export default async function SpacialStudentNewPage() {
  const { scope } = await requireSpacialStudentWriteAccess();
  const schools = await listSchoolsForSpacialFilter();

  return (
    <SpacialStudentForm
      action={createSpacialStudent}
      title="เพิ่มนักเรียนพิเศษ"
      cancelHref="/modules/spacial_student/students"
      mode="create"
      schools={schools}
      lockSchool={scope.kind === "school"}
      defaultValues={{
        personId: "",
        schoolCode: scope.kind === "school" ? scope.schoolCode : "",
        disableType: 1,
        disableDetail: "",
        other: "",
        status: 0,
      }}
    />
  );
}
