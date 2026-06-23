import { SchoolForm } from "@/components/core/school-form";
import { createSchool } from "@/lib/core/schools/actions";
import { listSchoolGroupsForSelect } from "@/lib/core/schools/queries";

export default async function NewSchoolPage() {
  const schoolGroups = await listSchoolGroupsForSelect();

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <SchoolForm
        mode="create"
        title="เพิ่มสถานศึกษา"
        cancelHref="/admin/schools"
        schoolGroups={schoolGroups}
        action={createSchool}
      />
    </section>
  );
}
