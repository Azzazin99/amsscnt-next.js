import { notFound } from "next/navigation";
import { SchoolForm } from "@/components/core/school-form";
import { updateSchool } from "@/lib/core/schools/actions";
import {
  getSchoolById,
  listSchoolGroupsForSelect,
} from "@/lib/core/schools/queries";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditSchoolPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id < 1) notFound();

  const [school, schoolGroups] = await Promise.all([
    getSchoolById(id),
    listSchoolGroupsForSelect(),
  ]);

  if (!school) notFound();

  const boundUpdate = updateSchool.bind(null, id);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <SchoolForm
        mode="edit"
        title="แก้ไขสถานศึกษา"
        cancelHref="/admin/schools"
        schoolGroups={schoolGroups}
        action={boundUpdate}
        defaultValues={{
          schoolCode: school.schoolCode,
          name: school.name,
          schoolType: school.schoolType,
          schoolGroupId: school.schoolGroupId,
          active: school.active,
        }}
      />
    </section>
  );
}
