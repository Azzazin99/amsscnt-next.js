import { notFound } from "next/navigation";
import { WorkgroupForm } from "@/components/core/workgroup-form";
import {
  deleteWorkgroup,
  updateWorkgroup,
} from "@/lib/core/workgroups/actions";
import {
  countPeopleInWorkgroup,
  countRegisterRefsForWorkgroup,
  getWorkgroupById,
} from "@/lib/core/workgroups/queries";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditWorkgroupPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id < 1) notFound();

  const [workgroup, peopleCount, registerCount] = await Promise.all([
    getWorkgroupById(id),
    countPeopleInWorkgroup(id),
    countRegisterRefsForWorkgroup(id),
  ]);

  if (!workgroup) notFound();

  const boundUpdate = updateWorkgroup.bind(null, id);
  const boundDelete = deleteWorkgroup.bind(null, id);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <WorkgroupForm
        mode="edit"
        title="แก้ไขกลุ่มงาน"
        cancelHref="/admin/workgroups"
        action={boundUpdate}
        deleteAction={boundDelete}
        peopleCount={peopleCount}
        registerCount={registerCount}
        legacyCode={workgroup.legacyCode}
        defaultValues={{
          name: workgroup.name,
          sortOrder: workgroup.sortOrder,
          active: workgroup.active,
        }}
      />
    </section>
  );
}
