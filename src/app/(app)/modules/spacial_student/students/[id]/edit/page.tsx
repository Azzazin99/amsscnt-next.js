import { notFound } from "next/navigation";
import { SpacialStudentForm } from "@/components/spacial-student/spacial-student-form";
import { updateSpacialStudent } from "@/lib/spacial-student/actions";
import {
  canViewSpacialStudent,
  getSpacialStudent,
  listSchoolsForSpacialFilter,
} from "@/lib/spacial-student/queries";
import { requireSpacialStudentWriteAccess } from "@/lib/spacial-student/scope";

type Props = { params: Promise<{ id: string }> };

export default async function SpacialStudentEditPage({ params }: Props) {
  const { scope } = await requireSpacialStudentWriteAccess();
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const [record, schools] = await Promise.all([
    getSpacialStudent(id),
    listSchoolsForSpacialFilter(),
  ]);
  if (!record || !canViewSpacialStudent(record, scope)) notFound();

  return (
    <SpacialStudentForm
      action={updateSpacialStudent.bind(null, id)}
      title="แก้ไขข้อมูลนักเรียนพิเศษ"
      cancelHref="/modules/spacial_student/students"
      mode="edit"
      recordId={id}
      schools={schools}
      lockSchool={scope.kind === "school"}
      studentLabel={record.displayName}
      defaultValues={{
        personId: record.personId,
        schoolCode: record.schoolCode,
        disableType: record.disableType,
        disableDetail: record.disableDetail,
        other: record.other,
        status: record.status,
      }}
    />
  );
}
