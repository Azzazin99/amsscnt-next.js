import { notFound, redirect } from "next/navigation";
import { NewsMainitemForm } from "@/components/news/news-mainitem-form";
import { updateNewsMainitem } from "@/lib/news/actions";
import { canManageNewsSettings } from "@/lib/news/permissions";
import { getNewsMainitem } from "@/lib/news/queries";
import { requireNewsScope } from "@/lib/news/scope";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NewsMainitemEditPage({ params }: Props) {
  const { user } = await requireNewsScope();
  if (!canManageNewsSettings(user)) redirect("/modules/news");

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const row = await getNewsMainitem(id);
  if (!row) notFound();

  return (
    <NewsMainitemForm
      action={updateNewsMainitem.bind(null, id)}
      title="แก้ไขชื่อเรื่อง"
      cancelHref="/modules/news/mainitems"
      defaultValues={{
        code: row.code,
        mainitem: row.mainitem,
        itemActive: row.itemActive,
      }}
    />
  );
}
