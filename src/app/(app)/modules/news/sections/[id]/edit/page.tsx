import { notFound, redirect } from "next/navigation";
import { NewsSectionForm } from "@/components/news/news-section-form";
import { updateNewsSection } from "@/lib/news/actions";
import { canManageNewsSettings } from "@/lib/news/permissions";
import { getNewsSection } from "@/lib/news/queries";
import { requireNewsScope } from "@/lib/news/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NewsSectionEditPage({ params }: Props) {
  const { user } = await requireNewsScope();
  if (!canManageNewsSettings(user)) redirect("/modules/news");

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const section = await getNewsSection(id);
  if (!section) notFound();

  return (
    <NewsSectionForm
      action={updateNewsSection.bind(null, id)}
      title="แก้ไขประเภทข่าว"
      cancelHref="/modules/news/sections"
      defaultValues={{ code: section.code, name: section.name }}
    />
  );
}
