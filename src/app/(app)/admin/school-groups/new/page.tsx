import { SchoolGroupForm } from "@/components/core/school-group-form";
import { createSchoolGroup } from "@/lib/core/school-groups/actions";

export default function NewSchoolGroupPage() {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <SchoolGroupForm
        mode="create"
        title="เพิ่มกลุ่มสถานศึกษา"
        cancelHref="/admin/school-groups"
        action={createSchoolGroup}
        defaultValues={{ sortOrder: 0 }}
      />
    </section>
  );
}
