import { StudentForm } from "@/components/student-main/student-form";
import { createStudent } from "@/lib/student-main/actions";
import { getActiveStudentEdYear, listSchoolsForStudentFilter } from "@/lib/student-main/queries";
import { requireStudentWriteAccess } from "@/lib/student-main/scope";

export default async function StudentMainNewPage() {
  const { scope } = await requireStudentWriteAccess();
  const [schools, activeYear] = await Promise.all([
    listSchoolsForStudentFilter(),
    getActiveStudentEdYear(),
  ]);

  return (
    <StudentForm
      action={createStudent}
      title="เพิ่มข้อมูลนักเรียน"
      cancelHref="/modules/student_main/students"
      mode="create"
      schools={schools}
      lockSchool={scope.kind === "school"}
      defaultValues={{
        edYear: activeYear?.edYear ?? new Date().getFullYear() + 543,
        schoolCode: scope.kind === "school" ? scope.schoolCode : "",
        studentId: "",
        personId: "",
        prename: "",
        name: "",
        surname: "",
        sex: "ช",
        classLevel: 1,
        classroom: 1,
      }}
    />
  );
}
