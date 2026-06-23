import { notFound } from "next/navigation";
import { SchoolGroupForm } from "@/components/core/school-group-form";
import {
  deleteSchoolGroup,
  updateSchoolGroup,
} from "@/lib/core/school-groups/actions";
import {
  countSchoolsInGroup,
  getSchoolGroupById,
} from "@/lib/core/school-groups/queries";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditSchoolGroupPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id < 1) notFound();

  const [group, schoolCount] = await Promise.all([
    getSchoolGroupById(id),
    countSchoolsInGroup(id),
  ]);

  if (!group) notFound();

  const boundUpdate = updateSchoolGroup.bind(null, id);
  const boundDelete = deleteSchoolGroup.bind(null, id);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <SchoolGroupForm
        mode="edit"
        title="แก้ไขกลุ่มสถานศึกษา"
        cancelHref="/admin/school-groups"
        action={boundUpdate}
        deleteAction={boundDelete}
        schoolCount={schoolCount}
        defaultValues={{
          name: group.name,
          sortOrder: group.sortOrder,
        }}
      />
    </section>
  );
}
