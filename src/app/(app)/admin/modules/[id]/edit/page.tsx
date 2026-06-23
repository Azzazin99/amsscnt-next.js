import { notFound } from "next/navigation";
import { ModuleForm } from "@/components/core/module-form";
import { updateModule } from "@/lib/core/modules/actions";
import { getModuleById } from "@/lib/core/modules/queries";

type Props = { params: Promise<{ id: string }> };

export default async function EditModulePage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isFinite(id) || id < 1) notFound();

  const mod = await getModuleById(id);
  if (!mod) notFound();

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <ModuleForm
        title="แก้ไขโมดูล"
        cancelHref="/admin/modules"
        slug={mod.slug}
        action={updateModule.bind(null, id)}
        defaultValues={{ name: mod.name, sortOrder: mod.sortOrder, active: mod.active }}
      />
    </section>
  );
}
