import { notFound } from "next/navigation";
import { PersonForm } from "@/components/person/person-form";
import { updatePerson } from "@/lib/person/actions";
import {
  getPersonById,
  listPersonSchoolAssignments,
  listSchoolsForPersonFilter,
  listWorkgroupsForPersonFilter,
} from "@/lib/person/queries";
import { requirePersonWriteAccess } from "@/lib/person/scope";

type Props = { params: Promise<{ id: string }> };

export default async function PersonStaffEditPage({ params }: Props) {
  const { scope } = await requirePersonWriteAccess();
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const person = await getPersonById(id);
  if (!person) notFound();

  if (scope.kind === "school" && person.schoolId !== scope.schoolId) {
    notFound();
  }

  const [schools, workgroups, assignments] = await Promise.all([
    listSchoolsForPersonFilter(),
    listWorkgroupsForPersonFilter(),
    listPersonSchoolAssignments(person.personId),
  ]);

  const extraSchoolIds = assignments
    .map((a) => a.schoolId)
    .filter((sid) => sid !== person.schoolId);

  return (
    <PersonForm
      action={updatePerson.bind(null, id)}
      title="แก้ไขบุคลากร"
      cancelHref="/modules/person/staff"
      mode="edit"
      schools={schools}
      workgroups={workgroups}
      lockOrg={scope.kind === "school"}
      defaultValues={{
        personId: person.personId,
        prefix: person.prefix,
        firstName: person.firstName,
        lastName: person.lastName,
        organizationType: person.organizationType,
        schoolId: person.schoolId,
        workgroupId: person.workgroupId,
        positionCode: person.positionCode ?? 0,
        status: person.status,
        multiSchool: person.multiSchool,
        extraSchoolIds,
        serviceStartDate: person.serviceStartDate,
      }}
    />
  );
}
