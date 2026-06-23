import { notFound } from "next/navigation";
import { StudentForm } from "@/components/student-main/student-form";
import { updateStudent } from "@/lib/student-main/actions";
import { canViewStudent, getStudent, listSchoolsForStudentFilter } from "@/lib/student-main/queries";
import { requireStudentWriteAccess } from "@/lib/student-main/scope";

type Props = { params: Promise<{ id: string }> };

export default async function StudentMainEditPage({ params }: Props) {
  const { scope } = await requireStudentWriteAccess();
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const [student, schools] = await Promise.all([getStudent(id), listSchoolsForStudentFilter()]);
  if (!student || !canViewStudent(student, scope)) notFound();

  return (
    <StudentForm
      action={updateStudent.bind(null, id)}
      title="แก้ไขข้อมูลนักเรียน"
      cancelHref="/modules/student_main/students"
      mode="edit"
      recordId={id}
      schools={schools}
      lockSchool={scope.kind === "school"}
      defaultValues={{
        edYear: student.edYear,
        schoolCode: student.schoolCode,
        studentId: student.studentId,
        personId: student.personId,
        prename: student.prename,
        name: student.name,
        surname: student.surname,
        sex: student.sex,
        classLevel: student.classLevel,
        classroom: student.classroom,
      }}
    />
  );
}
