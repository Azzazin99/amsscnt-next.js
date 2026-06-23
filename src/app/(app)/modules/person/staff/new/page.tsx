import { PersonForm } from "@/components/person/person-form";
import { createPerson } from "@/lib/person/actions";
import {
  listSchoolsForPersonFilter,
  listWorkgroupsForPersonFilter,
} from "@/lib/person/queries";
import { requirePersonWriteAccess } from "@/lib/person/scope";

export default async function PersonStaffNewPage() {
  const { scope } = await requirePersonWriteAccess();

  const [schools, workgroups] = await Promise.all([
    listSchoolsForPersonFilter(),
    listWorkgroupsForPersonFilter(),
  ]);

  const defaultOrg = scope.kind === "school" ? "school" : "district";
  const defaultSchoolId = scope.kind === "school" ? scope.schoolId : null;

  return (
    <PersonForm
      action={createPerson}
      title="เพิ่มบุคลากร"
      cancelHref="/modules/person/staff"
      mode="create"
      schools={schools}
      workgroups={workgroups}
      lockOrg={scope.kind === "school"}
      defaultValues={{
        organizationType: defaultOrg,
        schoolId: defaultSchoolId,
        positionCode: 0,
        status: 0,
      }}
    />
  );
}
